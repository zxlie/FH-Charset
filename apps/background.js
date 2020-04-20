/**
 * FH-Charset：网页编码集修改工具
 * @author zhaoxianlie
 */
let PageEncoding = (() => {

    // 某Tab的编码都暂存一下，这是prefix
    const ENCODING_PREFIX = 'FE_ENCODING_PREFIX_';
    let listenerAddedFlag = false;
    let contextMenuId = null;

    let resetEncoding = [
        ['default', '默认/重置']
    ];

    // 系统支持的编码列表
    let SystemCharsetList = [
        ['UTF-8', 'Unicode（UTF-8）'],
        ['GBK', '简体中文（GBK）'],
        ['GB3212', '简体中文（GB3212）'],
        ['GB18030', '简体中文（GB18030）'],
        ['Big5', '繁体中文（Big5）'],
        ['UTF-16LE', 'Unicode（UTF-16LE）'],
        ['EUC-KR', '韩文（EUC-KR）'],
        ['Shift_JIS', '日文（Shift_JIS）'],
        ['EUC-JP', '日文（EUC-JP）'],
        ['ISO-2022-JP', '日文（ISO-2022-JP）'],
        ['Windows-874', '泰文（Windows-874）'],
        ['Windows-1254', '土耳其文（Windows-1254）'],
        ['ISO-8859-7', '希腊文（ISO-8859-7）'],
        ['Windows-1253', '希腊文（Windows-1253）'],
        ['Windows-1252', '西文（Windows-1252）'],
        ['ISO-8859-15', '西文（ISO-8859-15）'],
        ['Macintosh', '西文（Macintosh）'],
        ['Windows-1258', '越南文（Windows-1258）'],
        ['ISO-8859-2', '中欧文（ISO-8859-2）'],
        ['Windows-1250', '中欧文（Windows-1250）']
    ];


    // 菜单列表
    let menuMap = {};

    /**
     * 创建右键菜单
     */
    let createMenu = () => {

        contextMenuId = chrome.contextMenus.create({
            title: "FH-Charset",
            contexts: ['all'],
            documentUrlPatterns: ['http://*/*', 'https://*/*', 'file://*/*']
        });

        chrome.contextMenus.create({
            contexts: ["all"],
            title: '检测当前网页字符集',
            parentId: contextMenuId,
            onclick: (info, tab) => {
                chrome.tabs.executeScript(tab.id, {code: 'document.charset'}, result => {
                    alert("当前网页字符集是：" + result);
                });
            }
        });
        chrome.contextMenus.create({
            type: 'separator',
            parentId: contextMenuId
        });

        // 如果已经在设置页重新设置过字符集，这里则做一个覆盖，负责还原为默认
        let encodingList = Array.from(SystemCharsetList);
        let customEncodings = JSON.parse(localStorage.getItem('fh-charset-customs') || '[]');
        if (customEncodings && customEncodings.length) {
            encodingList = customEncodings;
        } else {
            localStorage.setItem('fh-charset-customs', JSON.stringify(SystemCharsetList));
        }

        resetEncoding.concat(encodingList).forEach(item => {
            menuMap[item[0].toUpperCase()] = chrome.contextMenus.create({
                type: "radio",
                contexts: ["all"],
                title: item[0] === resetEncoding[0][0] ? resetEncoding[0][1] : `${item[1]}`,
                checked: false,
                parentId: contextMenuId,
                onclick: (info, tab) => {
                    if (!info.wasChecked || item[0] === resetEncoding[0][0]) {
                        if (item[0] === resetEncoding[0][0]) {
                            localStorage.removeItem(ENCODING_PREFIX + tab.id);
                        } else {
                            localStorage.setItem(ENCODING_PREFIX + tab.id, item[0]);
                        }
                        if (!listenerAddedFlag) {
                            addOnlineSiteEncodingListener(() => {
                                chrome.tabs.reload(tab.id, {
                                    bypassCache: true
                                });
                            });
                        } else {
                            chrome.tabs.reload(tab.id, {
                                bypassCache: true
                            });
                        }
                    }
                }
            });
        });

    };

    /**
     * 更新菜单的选中状态
     * @param tabId
     */
    let updateMenu = (tabId) => {

        // 选中它该选中的
        let encoding = localStorage.getItem(ENCODING_PREFIX + tabId) || '';
        let menuId = menuMap[encoding.toUpperCase()];

        Object.keys(menuMap).forEach(menu => {
            chrome.contextMenus.update(menuMap[menu], {
                checked: menuMap[menu] === menuId
            });
        });

    };


    /**
     * web请求截获，重置response Headers
     */
    let addOnlineSiteEncodingListener = (callback) => {
        listenerAddedFlag = true;

        const options = [
            chrome.webRequest.OnHeadersReceivedOptions.BLOCKING,
            chrome.webRequest.OnHeadersReceivedOptions.RESPONSE_HEADERS,
        ];
        if (chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')) {
            options.push(chrome.webRequest.OnHeadersReceivedOptions.EXTRA_HEADERS);
        }
        chrome.webRequest.onHeadersReceived.addListener((details) => {
            let tabEncoding = localStorage.getItem(ENCODING_PREFIX + details.tabId);

            if (tabEncoding) {
                let i, charsetPattern = /; ?charset=([^;]+)/;
                for (i = 0; i < details.responseHeaders.length; ++i) {
                    if (details.responseHeaders[i].name.toLowerCase() === 'content-type') {
                        let value = details.responseHeaders[i].value.toLowerCase();
                        if (
                            value.startsWith('text') ||
                            value.startsWith('application/javascript') ||
                            value.startsWith('application/x-javascript') ||
                            value.startsWith('application/json')
                        ) {
                            if (charsetPattern.test(value)) {
                                value = value.replace(charsetPattern.exec(value)[1], tabEncoding);
                            } else {
                                value += value.substr(-1) === ';' ? ' ' : '; ';
                                value += 'charset=' + tabEncoding;
                            }
                            details.responseHeaders[i].value = value;
                        }
                        break;
                    }
                }
                if (i >= details.responseHeaders.length) {
                    details.responseHeaders.push({
                        name: 'Content-Type',
                        value: 'text/plain; charset=' + tabEncoding
                    });
                }
            }
            return {responseHeaders: details.responseHeaders};
        }, {urls: ["<all_urls>"]}, options);

        // 标签被关闭时的检测
        chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
            localStorage.removeItem(ENCODING_PREFIX + tabId);
        });
        // 标签页有切换时
        chrome.tabs.onActivated.addListener((activeInfo) => {
            if (Object.keys(menuMap).length) {
                updateMenu(activeInfo.tabId);
            }
        });

        callback && callback();
    };

    chrome.runtime.onMessage.addListener(function (request, sender, callback) {
        // 如果发生了错误，就啥都别干了
        if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError);
            return true;
        }

        if (request.type === 'fh-charset-update-menu') {
            if (!contextMenuId) return;
            chrome.contextMenus.removeAll(() => {
                menuMap = {};
                createMenu();
            });
        }

        callback && callback();
        return true;
    });

    return {
        createMenu
    };

})();

PageEncoding.createMenu();