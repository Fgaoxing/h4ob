// HTML 4.0 JavaScript - Simplified
(function() {
    // Menu toggle
    var trigger = document.getElementById('menuTrigger');
    var overlay = document.getElementById('menuOverlay');
    
    if (trigger && overlay) {
        var isOpen = false;
        
        trigger.onclick = function() {
            isOpen = !isOpen;
            if (isOpen) {
                overlay.style.display = 'flex';
                overlay.style.opacity = '1';
                document.body.style.overflow = 'hidden';
            } else {
                overlay.style.display = 'none';
                overlay.style.opacity = '0';
                document.body.style.overflow = '';
            }
        };
        
        var links = overlay.getElementsByTagName('a');
        for (var i = 0; i < links.length; i++) {
            links[i].onclick = function() {
                isOpen = false;
                overlay.style.display = 'none';
                overlay.style.opacity = '0';
                document.body.style.overflow = '';
            };
        }
    }
    
    // Form handling
    var form = document.getElementById('home-contact-form');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            var name = document.getElementById('cf-name').value;
            var email = document.getElementById('cf-email').value;
            var message = document.getElementById('cf-msg').value;
            
            if (!name || !email || !message) {
                alert('请填写所有必填字段');
                return;
            }
            
            alert('消息已发送！');
            form.reset();
        };
    }
})();
