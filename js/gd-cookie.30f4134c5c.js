var gd_cookie = new function () {
    this.version = "2.2.51";
    var me = this;


    //*********** NE DIRAJ!!!******************
    const _COOKIE_CONSENT = "gd-cookieOptions";
    const _BLOCKED = "javascript/blocked";
    const _REQ_ID = "REQ";
    const _STATS_ID = "STATS";
    const _MARK_ID = "MARK";
    const _FUNKC_ID = "FUNKC";
    //**********************************************
    //**********************************************

    me.options = {
        GA_KEY: "GA_KEY", // analytics-test, google tracking account
        TITLE: "Ova web stranica upotrebljava kolačiće",
        COOKIE_DETAILS_URL: "https://COOKIEDETAILS",
        DESCRIPTION: "Na ovoj mrežnoj stranici koriste se kolačići. Molimo Vas da pročitate <a href='{COOKIE_DETAILS_URL}'>Obavijest o kolačićima</a> ili prilagodite postavke.",
        COOKIE_EXPIRE: 365, // trajanje cookia ravno godinu dana, u danima je vrijednost
        COOKIE_REQUIRED: {
            key: _REQ_ID,
            title: "Nužni",
            text: "<strong>Nužni kolačići - </strong>omogućuju interakciju s uslugom ili internetskom lokacijom kako biste mogli pristupiti osnovnim značajkama za pružanje te usluge. Odnose se na zatraženu uslugu kao što je, npr. identifikator sesije trenutačnog posjeta."
        },
        COOKIE_STATISTICS: {
            key: _STATS_ID,
            title: "Statistički",
            text: "<strong>Statistički kolačići - </strong>omogućuju prikupljanje podataka u agregiranom obliku bez identificiranja samoga korisnika. Služe za praćenje ponašanja korisnika na internetskoj stranici u svrhu istraživanja tržišta i praćenja analitike. Ovi uvidi omogućuju internetskoj stranici poboljšavanje sadržaja i razvijanje boljih značajki koje unaprjeđuju korisnički doživljaj."
        },
        COOKIE_MARKETING: {
            key: _MARK_ID,
            title: "Marketinški",
            text: "<strong>Marketinški kolačići - </strong>omogućuju prikupljanje informacija o navikama i ponašanju korisnika na internetskom mjestu radi objavljivanja relevantnih oglasa za korisnika usklađenih s njegovim interesima. Također se mogu koristiti i za mjerenje učinkovitosti neke kampanje."
        },
        COOKIE_FUNCTIONAL: {
            key: _FUNKC_ID,
            title: "Funkcionalni",
            text: "<strong>Funkcionalni kolačići - </strong>omogućuju internetskoj stranici pružanje poboljšane funkcionalnosti i personalizaciju, npr. pamćenje jezika na kojem se prikazuje sadržaj stranica toga internetskog mjesta."
        },
        RELOAD_AFTER_SELECTION: true,
        IS_MODAL: false,
        EXPANDED: false,
        THREE_BUTTONS: true,
        BTN_DEFAULT_TXT: "Prihvaćam nužne",
        BTN_ACCEPT_ALL: {
            text: "Prihvaćam sve",
            css: ""
        },
        BTN_ADJUST: {
            text: "Prilagodi",
            css: ""
        },
        BTN_ACCEPT_OPTIONS: {
            text: "Prihvaćam odabrane",
            css: ""
        },
        DEBUG: false,
        IS_CONSENTMODE_CONFIGURED_OVER_GTM: false, /*#71844 k52 - true*/
        CONSENT_CALLBACK: function () {
            me.setGoogleConsent("update");
            me.InsertBuffer();
        },
        WHITELIST: ["googletagmanager.com", "sentry", "maps.google.com", "mini-profiler-resources"],
        BLACKLIST: [
            {
                category: _MARK_ID,
                search: "fbevents.js"
            }

        ],
        ENCODE_COOKIE: false
    }

    //**********************************************
    //**********************************************

    //**********************************************
    //*********** NE DIRAJ!!!******************

    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
    var defaultElement = null;
    var defaultBtnText = me.options.BTN_DEFAULT_TXT;
    //**********************************************
    //**********************************************
    this.CONSENT_ACCEPTED = false;
    this.STATS_CONSENT = false;
    this.MARK_CONSENT = false;
    this.FUNKC_CONSENT = false;
    this.GA_KEYS = [];

    var statsBlocked = [];
    var marketingBlocked = [];
    var funkcionalniBlocked = [];
    var unblocked = [];

    this.BUTTONS = {
        ACCEPT_ALL: null,
        ACCEPT_OPTIONS: null,
        ADJUST: null
    }

    //load basic config options
    this.addObserver = function () {

        "use strict";
        var observer = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length - 1; i++) {
                var addedNodes = mutations[i].addedNodes;
                //me.debugLog("mutations total: " + mutations.length);
                for (var j = 0; j < addedNodes.length; j++) {
                    // For each added script tag, Sarma evoluirao funkciju
                    var node = addedNodes[j];
                    if ((node.tagName === 'SCRIPT') && me.needsToBeBlocked(node) && node.type !== _BLOCKED) {
                        me.debugLog("BLOCKED " + node.tagName + " " + node.src);
                        //me.debugLog(node.src + " " + node.nodeType === 1 + " found....");
                        node.type = _BLOCKED;

                        // Firefox has this additional event which prevents scripts from beeing executed, 
                        var beforeScriptExecuteListener = function beforeScriptExecuteListener(event) {
                            // Prevent only marked scripts from executing
                            if (node.type === _BLOCKED) {
                                me.debugLog("Firefox fix trigger....");
                                event.preventDefault();
                            }

                            node.removeEventListener('beforescriptexecute', beforeScriptExecuteListener);
                        };

                        //node.addEventListener('beforescriptexecute', beforeScriptExecuteListener);
                    }
                }
            }
        });

        // Starts the monitoring
        observer.observe(document, {
            childList: true,
            subtree: true
        });

        return observer;
    }

    this.unblockBlockedScript = function (node) {
        const scriptNode = document.createElement('script');
        scriptNode.setAttribute('src', node.src);
        scriptNode.setAttribute('type', 'application/javascript');
        document.head.appendChild(scriptNode);
    }

    this.needsToBeBlocked = function (node) {

        if (node.src === undefined || node.src == "")
            return false;

        //ignore uvijek za CAPTCHA (google), nikada ne blokiraj
        if (node.src.indexOf("/recaptcha") > -1 || node.src.indexOf("chrome-extension") > -1) {
            return false;
        }

        if (me.options.WHITELIST.filter(x => node.src.includes(x)).length > 0) {
            me.debugLog("WHITELIST " + node.src);
            return false;
        }

        //samo posebno i specifično za google
        if (node.src.indexOf("google") > 1 && !me.STATS_CONSENT) {
            statsBlocked.push(node);
            return true;
        }

        //svi ostali koji nisu s naše domene
        if (!node.src.includes("globaldizajn") && !node.src.includes("localhost") && !me.MARK_CONSENT && !node.src.includes("google")) {
            marketingBlocked.push(node);
            return true;
        }


        if (!node.src.includes("globaldizajn") && !node.src.includes("localhost") && !me.FUNKC_CONSENT) {
            funkcionalniBlocked.push(node);
            return true;
        }

        return false;
    }

    document.addEventListener('DOMContentLoaded', function () {

        //DEBUG PUROPSE ONLY
        //deleteCookie(_COOKIE_CONSENT);
        //on DOM ready go
        if (!me.CONSENT_ACCEPTED) {
            me.setupDefaultElements();
        }
        me.addCookieShowHideBtn();
    });

    window.onload = function (event) {
        observer.disconnect();
        me.debugLog("OBSERVER REMOVED");
    };

    //load default website configuration
    this.loadConfiguration = function () {

        if (me.getCookie(_COOKIE_CONSENT) === null) {
            me.setGoogleConsent();
            //disable all GOOGLE STUFF
            me.disableEnableAllGAkeys(true);
            //reload basics
            window.cookieOptions = me.getDefaultOptions();
        } else {
            me.reloadFromCookies();
        }
    }

    this.getDefaultOptions = function () {
        return [
            me.buildOption(me.options.COOKIE_REQUIRED, true),
            /*me.buildOption(me.options.COOKIE_FUNCTIONAL, false),*/
            me.buildOption(me.options.COOKIE_STATISTICS, false),
            me.buildOption(me.options.COOKIE_MARKETING, false)
        ]
    }

    this.buildOption = function (cookieType, checked) {
        return { title: encodeURIComponent(cookieType.title), id: cookieType.key, checked: checked };
    }

    this.createButton = function (id, buttonOptions, callback, btnHolder) {
        var button = document.createElement("div");
        button.setAttribute("class", "gdc-button " + buttonOptions.css);
        button.id = id;
        button.innerHTML = buttonOptions.text;
        button.addEventListener("click", callback);
        btnHolder.appendChild(button);
        return button;
    }

    //setup default html elements
    this.setupDefaultElements = function () {

        if (me.options.IS_MODAL) {
            var shade = document.createElement("div");
            shade.setAttribute("class", "gdc-shade");
            shade.setAttribute("id", "gdc-shade");
            document.body.appendChild(shade);
            defaultElement = shade;
        }

        var container = document.createElement("div");
        container.setAttribute("class", "gdc-container");
        if (me.options.IS_MODAL) container.setAttribute("class", "gdc-container-modal");
        container.setAttribute("id", "gdc-container");
        if (!me.options.IS_MODAL) {
            document.body.appendChild(container);
            defaultElement = container;
        } else {
            defaultElement.appendChild(container);
        }

        var gdcTitle = document.createElement("div");
        gdcTitle.setAttribute("class", "gdc-title");
        gdcTitle.innerHTML = me.options.TITLE;
        container.appendChild(gdcTitle);

        var gdcExtraContent = document.createElement("div");
        gdcExtraContent.setAttribute("class", "gdc-content-extra");
        gdcExtraContent.setAttribute("id", "gdc-content-extra");
        if (me.CONSENT_ACCEPTED || !me.options.EXPANDED) gdcExtraContent.setAttribute("style", "display:none;")
        container.appendChild(gdcExtraContent);

        var content = document.createElement("div");
        content.setAttribute("class", "gdc-content");
        container.appendChild(content);

        var description = document.createElement("div");
        description.setAttribute("class", "gdc-description");
        description.innerHTML = me.options.DESCRIPTION.replace("{COOKIE_DETAILS_URL}", me.options.COOKIE_DETAILS_URL);
        content.appendChild(description);

        var btnHolder = document.createElement("div");
        btnHolder.setAttribute("class", "gdc-btnHolder");
        content.appendChild(btnHolder);


        var cookiePolicyHolder = document.createElement("div");
        cookiePolicyHolder.setAttribute("class", "gdc-cookiePolicyHolder");
        cookiePolicyHolder.innerHTML = me.options.COOKIE_POLICY.replace("{COOKIE_DETAILS_URL}", me.options.COOKIE_DETAILS_URL);
        content.appendChild(cookiePolicyHolder);

        me.BUTTONS.ACCEPT_OPTIONS = me.createButton("gdc-accept-selected", { text: defaultBtnText, css: me.options.BTN_ACCEPT_OPTIONS.css }, me.saveUserCookieSettings, btnHolder);

        var options = document.createElement("div");
        options.setAttribute("class", "gdc-options");

        if (window.cookieOptions == null)
            me.reloadFromCookies();

        for (var i = 0; i < window.cookieOptions.length; i++) {
            var current = window.cookieOptions[i];
            var chk = document.createElement("input");
            chk.setAttribute("class", "gdc-checkbox");
            chk.setAttribute("type", "checkbox");
            chk.setAttribute("id", current.id);
            chk.addEventListener("change", (ev) => me.validateBtnText());
            if (current.checked) chk.setAttribute("checked", "checked");
            if (i === 0) chk.setAttribute("disabled", "disabled");
            //add label to accompanie my checkbox
            var lbl = document.createElement("label");

            lbl.textContent = decodeURIComponent(me.getCookieType(current.id, current.title));
            lbl.setAttribute("class", "gdc-checkbox-label");
            lbl.setAttribute("for", current.id);
            options.appendChild(chk);
            options.appendChild(lbl);

            var _content = document.createElement("div");
            _content.setAttribute("class", "gdc-smallTxt");
            _content.setAttribute("id", "gdc-smallTxt-" + current.id);
            if (current.id == "REQ") { _content.innerHTML = me.options.COOKIE_REQUIRED.text; }
            if (current.id == "FUNKC") { _content.innerHTML = me.options.COOKIE_FUNCTIONAL.text; }
            if (current.id == "STATS") { _content.innerHTML = me.options.COOKIE_STATISTICS.text; }
            if (current.id == "MARK") { _content.innerHTML = me.options.COOKIE_MARKETING.text; }

            var expander = document.createElement("div");
            expander.setAttribute("class", "gdc-smallTxt-expander");
            expander.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20.002' viewBox='0 0 20 20.002'><g transform='translate(-632 -315)'><circle cx='9' cy='9' r='9' transform='translate(633 316)'/><path class='gdc-info-icon-bkg' d='M49.229,75.723a10.168,10.168,0,0,1-5.135-2,14.075,14.075,0,0,1-1.907-1.907,10,10,0,0,1,0-12.107A14.075,14.075,0,0,1,44.094,57.8a10,10,0,0,1,12.106,0,14.074,14.074,0,0,1,1.907,1.907,10,10,0,0,1,0,12.106A14.074,14.074,0,0,1,56.2,73.724,10.1,10.1,0,0,1,49.229,75.723Zm1.179-3.866a7.025,7.025,0,0,0,1.456-.455l.369-.148.087-.346c.078-.309.08-.343.022-.324A2.3,2.3,0,0,1,50.9,70.7c-.262-.1-.339-.271-.335-.721a8.949,8.949,0,0,1,.545-2.407,5.921,5.921,0,0,0,.412-2.475,1.683,1.683,0,0,0-1.866-1.33,5.3,5.3,0,0,0-2.006.482l-.332.134-.065.238c-.036.131-.076.289-.09.352l-.025.115.305-.1a1.959,1.959,0,0,1,1.222-.026c.227.134.294.294.289.7a8.56,8.56,0,0,1-.506,2.247,9.471,9.471,0,0,0-.472,2.133,1.506,1.506,0,0,0,.49,1.352,2.387,2.387,0,0,0,1.945.459Zm1.21-9.5a1.4,1.4,0,0,0,.913-1.579,1.556,1.556,0,0,0-2.652-.66,1.358,1.358,0,0,0-.18,1.621,1.622,1.622,0,0,0,1.919.619Z' transform='translate(591.853 259.24)' fill='#00fc93'/></g></svg>";
            expander.setAttribute("onClick", "gd_cookie.showHide('gdc-smallTxt-" + current.id + "','gdc-smallTxt')");
            options.appendChild(expander);

            var splitter = document.createElement("div");
            splitter.setAttribute("class", "gdc-smallTxt-splitter");
            options.appendChild(splitter);

            options.appendChild(_content);
            options.appendChild(document.createElement("div"));
        };

        gdcExtraContent.appendChild(options);

        if (me.options.THREE_BUTTONS) {
            me.BUTTONS.ADJUST = me.createButton("gdc-options", me.options.BTN_ADJUST, me.showHideExtra, btnHolder);
        }

        me.BUTTONS.ACCEPT_ALL = me.createButton("gdc-accept-all", me.options.BTN_ACCEPT_ALL, me.saveUserCookieSettings_all, btnHolder);


        if (me.options.EXPANDED) me.showHideExtra();
    }

    this.showHideExtra = function () {
        me.showHide("gdc-content-extra");
    }

    this.validateBtnText = function () {
        var checks = document.getElementsByClassName("gdc-checkbox");
        defaultBtnText = me.options.BTN_DEFAULT_TXT;
        var defaultBtnSet = false;

        for (let i = 0; i < checks.length; i++) {
            var el = checks[i];
            if (el.id != "REQ" && el.checked) {
                defaultBtnSet = true;
                defaultBtnText = me.options.BTN_ACCEPT_OPTIONS.text;
            }
        }
        document.getElementById("gdc-accept-selected").innerHTML = defaultBtnText;

        document.getElementById("gdc-accept-selected").style.display = 'none';
        if (defaultBtnSet) {
            document.getElementById("gdc-accept-selected").style.display = 'block';
        }
        //
    }

    this.reloadFromCookies = function () {
        var loadedOptions = me.getCookie(_COOKIE_CONSENT);

        if (loadedOptions == null)
            loadedOptions = JSON.stringify(me.getDefaultOptions());

        if (loadedOptions.substr(0, 2) != "[{") {
            loadedOptions = atob(loadedOptions);
        }

        window.cookieOptions = JSON.parse(loadedOptions);
        me.CONSENT_ACCEPTED = true;
        me.enforceUserGDRP();

        if (typeof me.options.CONSENT_CALLBACK === 'function') {
            me.options.CONSENT_CALLBACK();
        }
    }

    this.enforceUserGDRP = function () {
        for (var i = 0; i < window.cookieOptions.length; i++) {
            var currentOption = window.cookieOptions[i];
            //disable statistic cookies here, user disabled
            if (currentOption.id === _STATS_ID) {
                me.STATS_CONSENT = currentOption.checked;
                if (currentOption.checked === false) {
                    me.disableEnableAllGAkeys(true);
                }
                else {
                    me.debugLog("STATS_CONSENT TRUE");
                    me.disableEnableAllGAkeys(false);
                }
            }

            //disable marketing cookies here, user disabled
            if (currentOption.id === _MARK_ID) {
                me.MARK_CONSENT = currentOption.checked;
                if (currentOption.checked === false) {
                    me.deleteMarketingCookies();
                }
                else {
                    me.debugLog("MARK_CONSENT TRUE");
                }
            }

            //disable functional cookies here, user disabled
            if (currentOption.id === _FUNKC_ID) {
                me.FUNKC_CONSENT = currentOption.checked;
                if (currentOption.checked === false) {
                    me.deleteFunctionalCookies();
                }
                else {
                    me.debugLog("FUNKC_CONSENT TRUE");
                }
            }
        }
    }

    this.deleteMarketingCookies = function () {

    }

    this.deleteFunctionalCookies = function () {

    }

    this.getCookie = function (name) {
        var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
        return v ? v[2] : null;
    }

    this.setCookie = function (name, value, days) {
        try {
            var d = new Date;
            d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
            document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
        } catch (e) { throw e; }
    }

    this.deleteCookie = function (name) { me.setCookie(name, '', -1); }

    this.saveUserCookieSettings = function () {
        window.cookieOptions.forEach(me.saveUserOptions);
        me.setCookie(_COOKIE_CONSENT, me.prepareCookie(), me.options.COOKIE_EXPIRE);
        var elem = defaultElement;
        elem.style.display = 'none';
        if (me.options.RELOAD_AFTER_SELECTION) {
            document.location.href = document.location.href;
        } else {
            me.reloadFromCookies();
        }
    };

    this.prepareCookie = function () {
        var cookieVal = JSON.stringify(window.cookieOptions);
        if (me.options.ENCODE_COOKIE)
            cookieVal = btoa(cookieVal);
        return cookieVal;
    }

    //delegate here
    this.saveUserOptions = function (item, index) {
        item.checked = document.getElementById(item.id).checked;
    }

    this.saveUserCookieSettings_all = function () {
        window.cookieOptions.forEach(me.saveUserOptions_all);
        me.setCookie(_COOKIE_CONSENT, me.prepareCookie(), me.options.COOKIE_EXPIRE);
        var elem = defaultElement;
        elem.style.display = 'none';
        if (me.options.RELOAD_AFTER_SELECTION) {
            document.location.href = document.location.href;
        } else {
            me.reloadFromCookies();
        }
    };

    //delegate here
    this.saveUserOptions_all = function (item, index) {
        document.getElementById(item.id).checked = true;
        item.checked = document.getElementById(item.id).checked;
    }

    this.disableEnableAllGAkeys = function (enableDisable) {
        me.GA_KEYS.forEach(x => window['ga-disable-' + x] = enableDisable);
    }

    this.addCookieShowHideBtn = function () {
        var button = document.createElement("div");
        button.setAttribute("class", "gdc-cookieSettings");
        button.setAttribute("id", "gdc-cookieSettings");
        button.addEventListener("click", me.cookieSettings);
        document.body.appendChild(button);
    }

    this.cookieSettings = function () {
        if (defaultElement == null) {
            me.setupDefaultElements();
        }
        else if (defaultElement.style.display == "") {
            defaultElement.style.display = "none";
        } else if (defaultElement.style.display == "none") {
            defaultElement.style.display = "";
        }
        me.validateBtnText();
    }

    this.showHide = function (id, hideByClassName) {

        console.log("hideByClassName", hideByClassName);

        if (hideByClassName != undefined) {
            var elems = document.getElementsByClassName(hideByClassName);
            for (var i = 0; i < elems.length; i++) {
                elems.item(i).style.display = "none";
            }
        }

        if (document.getElementById(id).style.display == "none") {
            document.getElementById(id).style.display = "block";
        } else {
            document.getElementById(id).style.display = "none";
        }
    }

    this.refresh = function () {
        defaultElement = null;
        document.getElementById("gdc-container").remove();
        me.cookieSettings();
    }

    this.debugLog = function (msg) {
        if (!me.options.DEBUG)
            return;

        console.log(...arguments);
    }

    this.getCookieType = function (id, title) {
        title = decodeURIComponent(title);
        if (me.options.COOKIE_REQUIRED.key == id)
            return me.options.COOKIE_REQUIRED.title;
        if (me.options.COOKIE_FUNCTIONAL.key == id)
            return me.options.COOKIE_FUNCTIONAL.title;
        if (me.options.COOKIE_STATISTICS.key == id)
            return me.options.COOKIE_STATISTICS.title;
        if (me.options.COOKIE_MARKETING.key == id)
            return me.options.COOKIE_MARKETING.title;
    }

    this.setGoogleConsent = function (action) {
        action = action || "default";
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }

        if (me.options.IS_CONSENTMODE_CONFIGURED_OVER_GTM === true)
            return;

        gtag('consent', action, {
            'ad_storage': gd_cookie.MARK_CONSENT ? 'granted' : 'denied',
            'ad_user_data': gd_cookie.MARK_CONSENT ? 'granted' : 'denied',
            'ad_personalization': gd_cookie.MARK_CONSENT ? 'granted' : 'denied',
            'analytics_storage': gd_cookie.STATS_CONSENT ? 'granted' : 'denied',
            'functionality_storage': gd_cookie.FUNKC_CONSENT ? 'granted' : 'denied',
            'personalization_storage': gd_cookie.FUNKC_CONSENT ? 'granted' : 'denied',
            'security_storage': 'granted'
        });
    }

    this.approvedCategory = function (category) {
        if (category == _MARK_ID && me.MARK_CONSENT)
            return true;
        if (category == _FUNKC_ID && me.FUNKC_CONSENT)
            return true;
        if (category == _STATS_ID && me.STATS_CONSENT)
            return true;
        return false;
    }

    this.buffer = {
        insertBefore: []
    };
    this.InsertBuffer = function () {
        me.buffer.insertBefore.forEach(action => {
            if (me.approvedCategory(action.category)) {
                me.debugLog("Inserting ", action.category, action);
                Node.prototype.appendChild.apply(action.this, action.arguments);
            }
            else {
                me.debugLog("Not approved yet ", action.category, action);
            }
        })
    }

    this.overrideInsertBefore = function () {
        Element.prototype.insertBefore = function (elem) {
            if (arguments[0].tagName === 'SCRIPT') {

                for (var i = 0; i < me.options.BLACKLIST.length; i++) {
                    var x = me.options.BLACKLIST[i];
                    if (arguments[0].outerHTML.indexOf(x.search) > -1 && !me.approvedCategory(x.category)) {
                        me.debugLog('BLOCKING InsertBefore:', arguments[0].outerHTML, arguments);
                        me.buffer.insertBefore.push({
                            'this': this,
                            'category': x.type,
                            arguments: arguments
                        });
                        return undefined;
                    }
                };
            }
            return Node.prototype.insertBefore.apply(this, arguments);
        };
    }

    var observer = null;

    if (gdCookieOptions != null) {

        Object.keys(gdCookieOptions).forEach((key, value) => me.options[key] = gdCookieOptions[key]);
        //REMAP OLD CONFIG
        if (gdCookieOptions.OBAVEZNO_TXT != null) me.options.COOKIE_REQUIRED.text = gdCookieOptions.OBAVEZNO_TXT;
        if (gdCookieOptions.STATISTIKA_TXT != null) me.options.COOKIE_STATISTICS.text = gdCookieOptions.STATISTIKA_TXT;
        if (gdCookieOptions.MARKETING_TXT != null) me.options.COOKIE_MARKETING.text = gdCookieOptions.MARKETING_TXT;
        if (gdCookieOptions.FUNKCIONALNI_TXT != null) me.options.COOKIE_FUNCTIONAL.text = gdCookieOptions.FUNKCIONALNI_TXT;
    }

    this.prepare_GA_Keys = function () {
        var keys = me.options.GA_KEY.split(";");
        keys.forEach(x => {
            me.GA_KEYS.push(x)
        });
    }

    this.init = function () {
        this.overrideInsertBefore();
        this.prepare_GA_Keys();
        this.loadConfiguration();
        observer = this.addObserver();
    }
}

gd_cookie.init();