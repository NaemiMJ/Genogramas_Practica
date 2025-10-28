
document.addEventListener("DOMContentLoaded", function() {
    
    const sidebarToggle = document.getElementById('sidebar-toggle');
      const pageWrapper = document.querySelector('.page-wrapper');
      const sidebarOverlay = document.querySelector('.sidebar-overlay');
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => pageWrapper.classList.toggle('sidebar-visible'));
        sidebarOverlay.addEventListener('click', () => pageWrapper.classList.remove('sidebar-visible'));
      }
   
    const pathArray = window.location.pathname.split('/');
    const currentPage = pathArray[pathArray.length - 1];

    
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-link');

  
    sidebarLinks.forEach(link => {
        const linkFile = link.getAttribute('href').split('/').pop();

     
        if (linkFile === currentPage) {
            link.classList.add('active');
        }
        
    });
});