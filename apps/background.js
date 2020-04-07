/**
 * FH-Charset：网页编码集修改工具
 * @author zhaoxianlie
 */
let PageEncoding = (() => {

    // 某Tab的编码都暂存一下，这是prefix
    const ENCODING_PREFIX = 'FE_ENCODING_PREFIX_';
    let listenerAddedFlag = false;

    // 系统支持的编码列表
    let EncodingList = [
        ['default', '默认'],
        ['UTF-8', 'Unicode'],
        ['GBK', '简体中文'],
        ['GB3212', '简体中文'],
        ['GB18030', '简体中文'],
        ['Big5', '繁体中文'],
        ['UTF-16LE', 'Unicode'],
        ['EUC-KR', '韩文'],
        ['Shift_JIS', '日文'],
        ['EUC-JP', '日文'],
        ['ISO-2022-JP', '日文'],
        ['Windows-874', '泰文'],
        ['Windows-1254', '土耳其文'],
        ['ISO-8859-7', '希腊文'],
        ['Windows-1253', '希腊文'],
        ['Windows-1252', '西文'],
        ['ISO-8859-15', '西文'],
        ['Macintosh', '西文'],
        ['Windows-1258', '越南文'],
        ['ISO-8859-2', '中欧文'],
        ['Windows-1250', '中欧文']
    ];


    // 菜单列表
    let menuMap = {};

    /**
     * 创建右键菜单
     */
    let createMenu = () => {

        let contextMenuId = chrome.contextMenus.create({
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

        EncodingList.forEach(item => {
            menuMap[item[0].toUpperCase()] = chrome.contextMenus.create({
                type: "radio",
                contexts: ["all"],
                title: item[0] === 'default' ? '默认' : `${item[1]}（${item[0]}）`,
                checked: item[0] === 'default',
                parentId: contextMenuId,
                onclick: (info, tab) => {
                    if (!info.wasChecked) {
                        if (item[0] === 'default') {
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
        Object.keys(menuMap).forEach(menu => {
            chrome.contextMenus.update(menuMap[menu], {
                checked: false
            });
        });

        // 选中它该选中的
        let encoding = localStorage.getItem(ENCODING_PREFIX + tabId) || '';
        let menuId = encoding ? menuMap[encoding.toUpperCase()] : menuMap['DEFAULT'];
        chrome.contextMenus.update(menuId || menuMap['DEFAULT'], {
            checked: true
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

    return {
        createMenu
    };

})();

PageEncoding.createMenu();