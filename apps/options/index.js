new Vue({
    el: '#pageContainer',
    data: {
        donate: {
            text: '微信打赏！继续加油！',
            image: './donate.jpeg'
        },
        manifest: {},
        charsetList: [],
        customCharset: []
    },

    created: function () {
        this.init();
        this.$nextTick(this.selectCharset)
    },

    methods: {

        donateToggle(event) {
            let box = this.$refs.boxDonate;
            if (box.classList.contains('hide')) {
                box.classList.remove('hide');
                box.style.top = (event.target.offsetTop + 30) + 'px';
                box.style.left = event.target.offsetLeft + 'px';
            } else {
                box.classList.add('hide');
            }
        },

        toggleAll(selected) {
            Array.from(document.querySelectorAll('input[name="charsets"]')).map(checkbox => {
                checkbox.checked = selected;
            });
        },

        getSelectedCharsets() {
            return Array.from(document.querySelectorAll('input[name="charsets"]')).filter(checkbox => checkbox.checked);
        },

        selectCharset(charsetId, event) {
            if (charsetId) {
                document.getElementById(charsetId).click();
            } else if (event) {
                event.stopPropagation();
            }

            let selectedItems = this.getSelectedCharsets();
            if (selectedItems.length === this.charsetList.length) {
                this.$refs.selectAll.indeterminate = false;
                this.$refs.selectAll.checked = true;
            } else if (selectedItems.length === 0) {
                this.$refs.selectAll.indeterminate = false;
                this.$refs.selectAll.checked = false;
            } else {
                this.$refs.selectAll.indeterminate = true;
            }
        },

        updateMenu(callback) {
            chrome.runtime.sendMessage({
                type: 'fh-charset-update-menu'
            }, callback);
        },

        resetCharset() {
            localStorage.removeItem('fh-charset-customs');

            this.updateMenu(() => {
                alert('操作成功，已还原到系统默认设置！');
                location.reload(true);
            });
        },

        saveCharset() {
            let selectedItems = this.getSelectedCharsets().map(checkbox =>
                [checkbox.value, checkbox.parentNode.parentNode.querySelector('td.x-charset').textContent]);
            localStorage.setItem('fh-charset-customs', JSON.stringify(selectedItems));

            this.updateMenu(() => {
                alert('数据保存成功！你右键菜单中的字符编码集已发生改变！');
            });
        },

        init() {
            let customEncodings = JSON.parse(localStorage.getItem('fh-charset-customs') || '[]');
            if (customEncodings && customEncodings.length) {
                this.customCharset = customEncodings.map(charset => charset[0].toLowerCase());
            }

            this.charsetList = [
                ["阿拉伯语 (ASMO 708)", "ASMO-708"],
                ["阿拉伯语 (DOS)", "DOS-720"],
                ["阿拉伯语 (ISO)", "iso-8859-6"],
                ["阿拉伯语 (Mac)", "x-mac-arabic"],
                ["阿拉伯语 (Windows)", "windows-1256"],
                ["波罗的语 (DOS)", "ibm775"],
                ["波罗的语 (ISO)", "iso-8859-4"],
                ["波罗的语 (Windows)", "windows-1257"],
                ["中欧字符 (DOS)", "ibm852"],
                ["中欧字符 (ISO)", "iso-8859-2"],
                ["中欧字符 (Mac)", "x-mac-ce"],
                ["中欧字符 (Windows)", "windows-1250"],
                ["中国国家标准", "gb18030"],
                ["简体中文 (EUC)", "EUC-CN"],
                ["简体中文 (GB2312)", "gb2312"],
                ["简体中文 (GB18030)", "gb18030"],
                ["简体中文 (HZ)", "hz-gb-2312"],
                ["简体中文 (Mac)", "x-mac-chinesesimp"],
                ["繁体中文 (Big5)", "big5"],
                ["繁体中文 (CNS)", "x-Chinese-CNS"],
                ["繁体中文 (Eten)", "x-Chinese-Eten"],
                ["繁体中文 (Mac)", "x-mac-chinesetrad"],
                ["西里尔语 (DOS)", "cp866"],
                ["西里尔语 (ISO)", "iso-8859-5"],
                ["西里尔语 (KOI8-R)", "koi8-r"],
                ["西里尔语 (KOI8-U)", "koi8-u"],
                ["西里尔语 (Mac)", "x-mac-cyrillic"],
                ["西里尔语 (Windows)", "windows-1251"],
                ["欧罗巴语", "x-Europa"],
                ["德语 (IA5)", "x-IA5-German"],
                ["希腊语 (DOS)", "ibm737"],
                ["希腊语 (ISO)", "iso-8859-7"],
                ["希腊语 (Mac)", "x-mac-greek"],
                ["希腊语 (Windows)", "windows-1253"],
                ["现代希腊语 (DOS)", "ibm869"],
                ["希伯来语 (DOS)", "DOS-862"],
                ["希伯来语 (ISO-Logical)", "iso-8859-8-i"],
                ["希伯来语 (ISO-Visual)", "iso-8859-8"],
                ["希伯来语 (Mac)", "x-mac-hebrew"],
                ["希伯来语 (Windows)", "windows-1255"],
                ["IBM EBCDIC (阿拉伯语)", "x-EBCDIC-Arabic"],
                ["IBM EBCDIC (西里尔文俄语)", "x-EBCDIC-CyrillicRussian"],
                ["IBM EBCDIC (保加利亚语)", "x-EBCDIC-CyrillicSerbianBulgarian"],
                ["IBM EBCDIC (丹麦-挪威)", "x-EBCDIC-DenmarkNorway"],
                ["IBM EBCDIC (丹麦-挪威-欧洲)", "x-ebcdic-denmarknorway-euro"],
                ["IBM EBCDIC (芬兰-瑞典)", "x-EBCDIC-FinlandSweden"],
                ["IBM EBCDIC (芬兰-瑞士-欧洲)", "x-ebcdic-finlandsweden-euro"],
                ["IBM EBCDIC (芬兰-瑞士-欧洲)", "x-ebcdic-finlandsweden-euro"],
                ["IBM EBCDIC (法国-欧洲)", "x-ebcdic-france-euro"],
                ["IBM EBCDIC (德国)", "x-EBCDIC-Germany"],
                ["IBM EBCDIC (德国-欧洲)", "x-ebcdic-germany-euro"],
                ["IBM EBCDIC (现代希腊语)", "x-EBCDIC-GreekModern"],
                ["IBM EBCDIC (希腊语)", "x-EBCDIC-Greek"],
                ["IBM EBCDIC (希伯来语)", "x-EBCDIC-Hebrew"],
                ["IBM EBCDIC (冰岛语)", "x-EBCDIC-Icelandic"],
                ["IBM EBCDIC (冰岛语-欧洲)", "x-ebcdic-icelandic-euro"],
                ["IBM EBCDIC (国际-欧洲)", "x-ebcdic-international-euro"],
                ["IBM EBCDIC (意大利语)", "x-EBCDIC-Italy"],
                ["IBM EBCDIC (意大利-欧洲)", "x-ebcdic-italy-euro"],
                ["IBM EBCDIC (日语和日语片假名)", "x-EBCDIC-JapaneseAndKana"],
                ["IBM EBCDIC (日语和日语-拉丁语)", "x-EBCDIC-JapaneseAndJapaneseLatin"],
                ["IBM EBCDIC (日语和美国-加拿大)", "x-EBCDIC-JapaneseAndUSCanada"],
                ["IBM EBCDIC (日语片假名)", "x-EBCDIC-JapaneseKatakana"],
                ["IBM EBCDIC (朝鲜语和朝鲜语扩展)", "x-EBCDIC-KoreanAndKoreanExtended"],
                ["IBM EBCDIC (朝鲜语扩展)", "x-EBCDIC-KoreanExtended"],
                ["IBM EBCDIC (多语言拉丁语-2)", "CP870"],
                ["IBM EBCDIC (简体中文)", "x-EBCDIC-SimplifiedChinese"],
                ["IBM EBCDIC (西班牙)", "X-EBCDIC-Spain"],
                ["IBM EBCDIC (西班牙-欧洲)", "x-ebcdic-spain-euro"],
                ["IBM EBCDIC (泰语)", "x-EBCDIC-Thai"],
                ["IBM EBCDIC (繁体中文)", "x-EBCDIC-TraditionalChinese"],
                ["IBM EBCDIC (土耳其拉丁语-5)", "CP1026"],
                ["IBM EBCDIC (土耳其语)", "x-EBCDIC-Turkish"],
                ["IBM EBCDIC (英国)", "x-EBCDIC-UK"],
                ["IBM EBCDIC (英国-欧洲)", "x-ebcdic-uk-euro"],
                ["IBM EBCDIC (美国-加拿大)", "ebcdic-cp-us"],
                ["IBM EBCDIC (美国-加拿大-欧洲)", "x-ebcdic-cp-us-euro"],
                ["冰岛语 (DOS)", "ibm861"],
                ["冰岛语 (Mac)", "x-mac-icelandic"],
                ["ISCII 阿萨姆语", "x-iscii-as"],
                ["ISCII 孟加拉语", "x-iscii-be"],
                ["ISCII 梵文", "x-iscii-de"],
                ["ISCII 古吉拉特语", "x-iscii-gu"],
                ["ISCII 埃纳德语", "x-iscii-ka"],
                ["ISCII 马拉雅拉姆语", "x-iscii-ma"],
                ["ISCII 奥里亚语", "x-iscii-or"],
                ["ISCII 旁遮普文", "x-iscii-pa"],
                ["ISCII 泰米尔语", "x-iscii-ta"],
                ["ISCII 泰卢固语", "x-iscii-te"],
                ["日语 (EUC)", "euc-jp"],
                ["日语 (JIS)", "iso-2022-jp"],
                ["日语 (JIS-允许1个字节的假名)", "csISO2022JP"],
                ["日语 (Mac)", "x-mac-japanese"],
                ["日语 (Shift-JIS)", "shift_jis"],
                ["韩语", "ks_c_5601-1987"],
                ["朝鲜语 (EUC)", "euc-kr"],
                ["朝鲜语 (ISO)", "iso-2022-kr"],
                ["朝鲜语 (Johab)", "Johab"],
                ["朝鲜语 (Mac)", "x-mac-korean"],
                ["Latin 3 (ISO)", "iso-8859-3"],
                ["Latin 9 (ISO)", "iso-8859-15"],
                ["挪威语 (IA5)", "x-IA5-Norwegian"],
                ["OEM 美国", "IBM437"],
                ["瑞典语 (IA5)", "x-IA5-Swedish"],
                ["泰语 (Windows)", "windows-874"],
                ["土耳其语 (DOS)", "ibm857"],
                ["土耳其语 (ISO)", "iso-8859-9"],
                ["土耳其语 (Mac)", "x-mac-turkish"],
                ["土耳其语 (Windows)", "windows-1254"],
                ["Unicode", "unicode"],
                ["Unicode (Big-Endian)", "unicodeFFFE"],
                ["Unicode (UTF-7)", "utf-7"],
                ["Unicode (UTF-8)", "utf-8"],
                ["US-ASCII", "us-ascii"],
                ["越南语 (Windows)", "windows-1258"],
                ["西欧语 (DOS)", "ibm850"],
                ["西欧语 (IA5)", "x-IA5"],
                ["西欧语 (ISO)", "iso-8859-1"],
                ["西欧语 (Mac)", "macintosh"],
                ["西欧语 (Windows)", "Windows-1252"]
            ];
            this.manifest = chrome.runtime.getManifest();
        },
    }
});