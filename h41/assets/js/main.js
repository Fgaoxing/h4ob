(function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            return Promise.allSettled(registrations.map(function (registration) {
                return registration.unregister();
            }));
        });
    }

    if ('caches' in window) {
        caches.keys().then(function (keys) {
            return Promise.allSettled(keys.filter(function (key) {
                return key.indexOf('homepage-') === 0;
            }).map(function (key) {
                return caches.delete(key);
            }));
        });
    }

    var devtoolsGuardTriggered = false;
    var devtoolsGuardNode = null;
    var devtoolsResizeHits = 0;
    var devtoolsConsoleOpen = false;
    var canBlockContextMenu = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

    const consoleProbe = {};
    consoleProbe.toString = function () {
        devtoolsConsoleOpen = true;
        return 'devtools';
    };
    console.log(consoleProbe);

    function ensureDevtoolsGuard() {
        alert("光敏性癫痫警告！！！接下来画面会有所闪烁，请注意不要再过暗的环境观看！")
        if (devtoolsGuardNode) return devtoolsGuardNode;

        var style = document.createElement('style');
        style.textContent = '' +
            'body.devtools-guard-active{overflow:hidden !important;opacity:1!important;animation:none!important;}' +
            'body.devtools-guard-active>*:not(.devtools-guard){visibility:hidden !important;pointer-events:none !important;}' +
            '.devtools-guard{position:fixed;inset:0;z-index:2147483647;display:none;align-items:center;justify-content:center;padding:24px;background:#fff;color:#b30000;text-align:center;font-family:inherit;animation:devtoolsGuardFlash 0.14s steps(1,end) infinite;}' +
            'body.devtools-guard-active .devtools-guard{display:flex;}' +
            '.devtools-guard__inner{display:grid;gap:16px;justify-items:center;max-width:720px;}' +
            '.devtools-guard__code{font-family:"Space Mono",monospace;font-size:clamp(56px,14vw,160px);font-weight:700;line-height:0.9;letter-spacing:-0.08em;}' +
            '.devtools-guard__title{font-size:clamp(26px,5vw,48px);font-weight:700;line-height:1.1;}' +
            '.devtools-guard__desc{font-size:16px;line-height:1.8;max-width:520px;}' +
            '@keyframes devtoolsGuardFlash{0%,49%{background:#b30000;color:#ffffff;}50%,100%{background:#ffffff;color:#b30000;}}';
        document.head.appendChild(style);

        devtoolsGuardNode = document.createElement('div');
        devtoolsGuardNode.className = 'devtools-guard';
        devtoolsGuardNode.setAttribute('role', 'alert');
        devtoolsGuardNode.setAttribute('aria-live', 'assertive');
        devtoolsGuardNode.innerHTML = '' +
            '<div class="devtools-guard__inner">' +
            '<div class="devtools-guard__code">WARNING</div>' +
            '<div class="devtools-guard__title">检测到开发者工具，页面已锁定</div>' +
            '<div class="devtools-guard__desc">请关闭 DevTools 后刷新页面继续访问。</div>' +
            '</div>';
        document.body.appendChild(devtoolsGuardNode);
        return devtoolsGuardNode;
    }

    function lockPage(reason) {
        if (devtoolsGuardTriggered) return;
        devtoolsGuardTriggered = true;
        document.documentElement.setAttribute('data-devtools-guard', reason || 'triggered');
        var guard = ensureDevtoolsGuard();
        document.body.className = 'devtools-guard-active';
        document.body.replaceChildren(guard);
    }

    function isDevtoolsShortcut(e) {
        var key = String(e.key || '').toLowerCase();
        return key === 'f12' ||
            (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
            (e.metaKey && e.altKey && (key === 'i' || key === 'j' || key === 'c')) ||
            (e.ctrlKey && key === 'u');
    }

    function detectDevtoolsByDebugger() {
        if (devtoolsGuardTriggered || document.visibilityState !== 'visible') return;
        var start = performance.now();
        debugger;
        if (performance.now() - start > 100) lockPage('debugger');
    }

    function checkDevToolsPure() {
        const fn = function(){};
        const str = fn.toString();
        if (str.length !== fn.toString().length) return true;

        let flag = false;
        const obj = {
            get xx() { flag = true; return 1; }
        };
        console.debug(obj);
        if (flag) return true;

        return !!(window.constructor && window.constructor.toString().indexOf('native code') === -1);
    }

    function detectDevtoolsByConsole() {
        if (devtoolsConsoleOpen) lockPage('console');
    }

    function runDevtoolsProbe() {
        if (checkDevToolsPure()) {
            lockPage('pure-detect');
        }

        detectDevtoolsByDebugger();
        detectDevtoolsByConsole();
    }

    if (canBlockContextMenu) {
        document.addEventListener('contextmenu', function (e) {
            e.preventDefault();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (!isDevtoolsShortcut(e)) return;
        e.preventDefault();
        e.stopPropagation();
        lockPage('shortcut');
    }, true);

    window.addEventListener('pageshow', runDevtoolsProbe);
    window.addEventListener('focus', function () {
        setTimeout(runDevtoolsProbe, 0);
    });
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') runDevtoolsProbe();
    });

    runDevtoolsProbe();
    [80, 240, 600].forEach(function (delay) {
        setTimeout(runDevtoolsProbe, delay);
    });
    setInterval(runDevtoolsProbe, 1200);

    var skipLink = document.querySelector('.skip-link');

    var prefetched = new Set();
    function prefetch(href) {
        if (prefetched.has(href)) return;
        prefetched.add(href);
        var link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
    }

    document.querySelectorAll('a[href]').forEach(function (a) {
        if (a.hostname && a.hostname !== location.hostname) return;
        if (a.getAttribute('target') === '_blank') return;
        a.addEventListener('mouseenter', function () { prefetch(this.href); }, { passive: true });
        a.addEventListener('touchstart', function () { prefetch(this.href); }, { passive: true });
    });

    var trigger = document.getElementById('menuTrigger') || document.getElementById('menuBtn');
    var overlay = document.getElementById('menuOverlay');
    if (trigger && overlay) {
        var links = overlay.querySelectorAll('.menu-link');
        var isOpen = false;

        function openMenu() {
            isOpen = true;
            trigger.setAttribute('aria-expanded', 'true');
            trigger.setAttribute('aria-label', '关闭导航菜单');
            overlay.classList.add('active');
            document.body.classList.add('menu-open');
            setTimeout(function () { if (links[0]) links[0].focus(); }, 350);
        }

        function closeMenu() {
            isOpen = false;
            trigger.setAttribute('aria-expanded', 'false');
            trigger.setAttribute('aria-label', '打开导航菜单');
            overlay.classList.remove('active');
            document.body.classList.remove('menu-open');
            trigger.focus();
        }

        trigger.addEventListener('click', function () { if (isOpen) closeMenu(); else openMenu(); });
        links.forEach(function (l) { l.addEventListener('click', function () { closeMenu(); }); });

        document.addEventListener('keydown', function (e) {
            if (!isOpen) return;
            if (e.key === 'Escape') { closeMenu(); return; }
            if (e.key === 'Tab') {
                var f = Array.from(links), a = document.activeElement, i = f.indexOf(a);
                if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
                else if (!e.shiftKey && i >= f.length - 1) { e.preventDefault(); f[0].focus(); }
            }
        });
    }

    var isNavigating = false;

    function pjaxNavigate(href, isPopstate) {
        if (isNavigating) return;
        isNavigating = true;

        document.body.classList.add('page-exit');

        setTimeout(function () {
            fetch(href, {
                headers: { 'X-PJAX': 'true' },
                credentials: 'same-origin'
            })
            .then(function(response) {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(function(html) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');

                var newBody = doc.body;
                var newTitle = doc.querySelector('title').textContent;
                var newHtmlClass = doc.documentElement.className;

                document.title = newTitle;
                document.documentElement.className = newHtmlClass;

                var oldBody = document.body;
                var newBodyClone = document.importNode(newBody, true);

                oldBody.parentNode.replaceChild(newBodyClone, oldBody);

                window.scrollTo(0, 0);

                document.body.classList.remove('page-exit', 'loaded', 'menu-open');
                document.body.style.opacity = '0';
                document.body.style.transform = 'translateY(16px)';
                document.body.style.transition = 'none';

                executeInlineScripts(newBodyClone);

                initPageEvents(true);

                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        document.body.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
                        document.body.style.opacity = '1';
                        document.body.style.transform = 'translateY(0)';
                    });
                });

                if (!isPopstate) {
                    history.pushState({ url: href }, '', href);
                }

                isNavigating = false;
            })
            .catch(function(error) {
                console.error('Pjax navigation failed:', error);
                location.href = href;
                isNavigating = false;
            });
        }, 280);
    }

    function executeInlineScripts(bodyElement) {
        var scripts = bodyElement.querySelectorAll('script:not([src])');
        scripts.forEach(function(script) {
            try {
                eval(script.textContent);
            } catch(e) {
                console.error('Script execution error:', e);
            }
        });
    }

    function initPageEvents(isPjaxNav) {
        var newTrigger = document.getElementById('menuTrigger') || document.getElementById('menuBtn');
        var newOverlay = document.getElementById('menuOverlay');

        if (newTrigger && newOverlay) {
            var newLinks = newOverlay.querySelectorAll('.menu-link');
            var menuIsOpen = false;

            function openMenuFn() {
                menuIsOpen = true;
                newTrigger.setAttribute('aria-expanded', 'true');
                newTrigger.setAttribute('aria-label', '关闭导航菜单');
                newOverlay.classList.add('active');
                document.body.classList.add('menu-open');
                setTimeout(function () { if (newLinks[0]) newLinks[0].focus(); }, 350);
            }

            function closeMenuFn() {
                menuIsOpen = false;
                newTrigger.setAttribute('aria-expanded', 'false');
                newTrigger.setAttribute('aria-label', '打开导航菜单');
                newOverlay.classList.remove('active');
                document.body.classList.remove('menu-open');
                newTrigger.focus();
            }

            newTrigger.onclick = null;
            newTrigger.addEventListener('click', function () { if (menuIsOpen) closeMenuFn(); else openMenuFn(); });

            newLinks.forEach(function(l) {
                l.onclick = null;
                l.addEventListener('click', function () { closeMenuFn(); });
            });
        }

        bindPjaxLinks();

        var isHomePage = document.documentElement.classList.contains('home-page');
        if (isHomePage && !isPjaxNav) {
            document.body.classList.add('loaded');
        } else if (!isHomePage) {
            document.body.classList.remove('loaded');
        }

        if (isHomePage) {
            initHomePageScripts();
        }

        initQuestionsAccordion();
    }

    function initQuestionsAccordion() {
        var questionsPage = document.querySelector('.questions-page');
        if (!questionsPage) return;

        var questionItems = questionsPage.querySelectorAll('.question-item');
        if (!questionItems.length) return;

        console.log('[Questions] Initializing accordion, found', questionItems.length, 'items');

        questionItems.forEach(function (item, index) {
            item.setAttribute('data-question-index', index);
            item.style.cursor = 'pointer';
            item.setAttribute('tabindex', '0');
            item.setAttribute('role', 'button');

            item.addEventListener('click', handleQuestionClick);
            item.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleQuestionClick.call(this, e);
                }
            });
        });

        function handleQuestionClick(e) {
            e.preventDefault();
            e.stopPropagation();

            var item = this;
            var isExpanded = item.getAttribute('aria-expanded') === 'true';

            console.log('[Questions] Clicked item:', isExpanded ? 'collapsing' : 'expanding');

            if (isExpanded) {
                collapseItem(item);
            } else {
                collapseAllItems();
                expandItem(item);
            }
        }

        function expandItem(item) {
            item.setAttribute('aria-expanded', 'true');
            var toggle = item.querySelector('.question-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'true');

            var contentId = item.querySelector('.question-toggle') ?
                item.querySelector('.question-toggle').getAttribute('aria-controls') : null;
            var content = contentId ? document.getElementById(contentId) : null;
            if (content) {
                content.hidden = false;
                content.style.display = 'block';
            }
        }

        function collapseItem(item) {
            item.setAttribute('aria-expanded', 'false');
            var toggle = item.querySelector('.question-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');

            var contentId = item.querySelector('.question-toggle') ?
                item.querySelector('.question-toggle').getAttribute('aria-controls') : null;
            var content = contentId ? document.getElementById(contentId) : null;
            if (content) {
                content.hidden = true;
                content.style.display = 'none';
            }
        }

        function collapseAllItems() {
            questionItems.forEach(function (otherItem) {
                if (otherItem !== this && otherItem.getAttribute('aria-expanded') === 'true') {
                    collapseItem(otherItem);
                }
            }.bind(this));
        }
    }

    function bindPjaxLinks() {
        document.querySelectorAll('a[href]').forEach(function (a) {
            if (a.dataset.pjaxBound) return;
            if (a.hostname && a.hostname !== location.hostname) return;
            if (a.getAttribute('target') === '_blank') return;

            a.dataset.pjaxBound = 'true';

            a.addEventListener('click', function (e) {
                e.preventDefault();
                var href = this.getAttribute('href');
                if (href.startsWith('#')) return;

                pjaxNavigate(href, false);
            });
        });
    }

    function initHomePageScripts() {
        var hero = document.getElementById('hero');
        if (!hero) return;

        var bgImg = new Image();
        bgImg.src = 'https://t.alcy.cc/fj?' + Date.now();
        bgImg.onload = function () {
            hero.style.backgroundImage = 'linear-gradient(90deg, rgb(0 0 0) 40%, rgb(0 0 0 / 75%) 100%), url(' + bgImg.src + ')';
            checkReady();
        };

        var avatarImg = document.querySelector('.hero-avatar');
        var avatarLoaded = false;
        if (avatarImg) {
            if (avatarImg.complete) {
                avatarLoaded = true;
            } else {
                avatarImg.onload = function () { avatarLoaded = true; checkReady(); };
            }
        }

        var bgReady = !hero;
        function checkReady() { if (!bgReady && bgImg.complete) bgReady = true; reveal(); }

        var revealed = false;
        function reveal() {
            if (revealed) return;
            if (hero && !bgReady) return;
            if (avatarImg && !avatarLoaded) return;
            revealed = true;
        }

        setTimeout(reveal, 3000);

        var progress = document.getElementById('progress');
        if (progress) {
            function updateProgress() {
                var scrollTop = window.scrollY;
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (docHeight > 0) {
                    progress.style.width = Math.min((scrollTop / docHeight * 100), 100) + '%';
                }
            }

            window.removeEventListener('scroll', updateProgress);
            window.addEventListener('scroll', updateProgress, { passive: true });
            updateProgress();

            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        entry.target.querySelectorAll('.skill-fill').forEach(function (f) {
                            f.style.width = f.dataset.w + '%';
                        });
                    }
                });
            }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

            document.querySelectorAll('.animate-in').forEach(function (el) {
                observer.observe(el);
            });
        }
    }

    bindPjaxLinks();

    window.addEventListener('popstate', function (e) {
        if (e.state && e.state.url) {
            pjaxNavigate(e.state.url, true);
        } else {
            location.reload();
        }
    });

    var isHomePg = document.documentElement.classList.contains('home-page');
    if (isHomePg) {
        document.body.classList.add('loaded');
        initHomePageScripts();
    } else {
        document.body.style.opacity = '1';
        document.body.style.transform = 'translateY(0)';
    }
})();