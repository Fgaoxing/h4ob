(function () {
    var links = document.querySelectorAll('nav a, footer a');
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href && href.indexOf('.html') !== -1) {
                document.body.style.opacity = '0';
                document.body.style.transform = 'translateY(-8px)';
            }
        });
    }

    document.body.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    document.body.style.opacity = '1';
    document.body.style.transform = 'translateY(0)';
})();
