// Stanovení globalních proměnných

// Tohle vezme tu část URL, která nás zajímá (např. "index.html")
const currentPage = window.location.pathname.split("/").pop();
console.log("Current page: " + currentPage);

// Proměná pro sledování stavu u sociálních sítí.
let navBarSocialsExpanded = false;

// Jednoduché funkce na převod jednotek. Nakonec jsem je nepoužil tak moc, jak jsem očekával
function pxToVw(px) {
  // console.log("pxToVw called with px:", px);
  return (px / window.innerWidth) * 100;
}
function pxToVh(px) {
  // console.log("pxToVh called with px:", px);
  return (px / window.innerHeight) * 100;
}
function vhToPx(vh) {
  // console.log("vhToPx called with vh:", vh);
  return (vh / 100) * window.innerHeight;
}


// Funkce pro získání typu zařízení na základě poměru stran obrazovky
function getDeviceType() {
  // console.log("getDeviceType called");
  
  const width = window.innerWidth;
  const height = window.innerHeight;

  // .toFixed(2) zaokrouhlí výsledné číslo na dvě desetinná místa
  const aspectRatio = +(width / height).toFixed(2);

  // Možná trošku extensivní seznam poměrů stran. Nakonec jich tolik nebylo potřeba, ale už nechci měnit ten kod.
  const knownRatios = [
    { ratio: 0.56, label: "9:16", index: 1 },      
    { ratio: 0.60, label: "3:5", index: 2 },       
    { ratio: 0.67, label: "2:3", index: 3 },       
    { ratio: 1.00, label: "1:1", index: 4 },       
    { ratio: 1.33, label: "4:3", index: 5 },       
    { ratio: 1.50, label: "3:2", index: 6 },
    { ratio: 1.60, label: "16:10", index: 7 },     
    { ratio: 1.67, label: "5:3", index: 8 },        
    { ratio: 1.78, label: "16:9", index: 9 },      
    { ratio: 2.00, label: "18:9", index: 10 },      
    { ratio: 2.17, label: "19.5:9", index: 11 },   
    { ratio: 2.22, label: "20:9", index: 12 },      
    { ratio: 2.33, label: "21:9", index: 13 },      
    { ratio: 3.56, label: "32:9", index: 14 },      
  ];

  // Získání nejbližšího poměru stran z předdefinovaného seznamu za pomocí jednoduchého porovnání rozdílů
  const closest = knownRatios.reduce((first, second) => {
    return Math.abs(second.ratio - aspectRatio) < Math.abs(first.ratio - aspectRatio) ? second : first;
  });

  return {
    ratio: aspectRatio,
    closestMatch: closest.label,
    index: closest.index,
  };
}


// Funkce pro fungování navbaru
function setupNavbar(deviceRatio) {
  console.log("setupNavbar called");

  const items = document.querySelectorAll(".nav-bar-item");
  const highlightTopLeft = document.querySelector(".nav-bar-highlight-left");
  const highlightBottomRight = document.querySelector(".nav-bar-highlight-right");

  let scrollSections = getScrollSections(deviceRatio); 
  let isHovering = false;
  let hoverTimeout;
  let scrollTimeout;

  // Proměná, kterou budeme zakazovat přesunutí highlights při např. hoverování itemu. Aby to jen tak neodjíždělo do pryč.
  let lockHighlight = false;


  // Zjištění adresy stránky. Vzhledem k tomu, že jediné jiné stránky než index jsou ty projekty, tak to stačí takhle
  const pathname = window.location.pathname;
  const isGalleryPage = pathname.includes("/projects/");

  // Pokud jsme na stránce projektu, bude to furt zobrazovat stejnou sekci. Jinak to bude normálně reagovat na scroll pozici
  function updateHighlightToCurrentSection() {
    if (!lockHighlight) {
      if (isGalleryPage) {
        moveHighlightToElement(items[2], highlightTopLeft, highlightBottomRight);
        return;
      }
      const currentSection = getCurrentSection(scrollSections);
      if (currentSection.navItem) {
        moveHighlightToElement(currentSection.navItem, highlightTopLeft, highlightBottomRight);
      }
    }
  }
  // Při hover na item se highlights přesunou na něj
  items.forEach((item, index) => {
    item.addEventListener("mouseenter", () => {
      isHovering = true;
      lockHighlight = true;
      clearTimeout(hoverTimeout);
      moveHighlightToElement(item, highlightTopLeft, highlightBottomRight, true);
    });

    // A při ukončení hover se vrátí zpět
    item.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        isHovering = false;
        lockHighlight = false;

        if (isGalleryPage) {
          moveHighlightToElement(items[2], highlightTopLeft, highlightBottomRight);
        } else {
          requestAnimationFrame(() => {
            scrollSections = getScrollSections(deviceRatio);
            const currentSection = getCurrentSection(scrollSections);
            const navItem = currentSection?.navItem;
            moveHighlightToElement(navItem, highlightTopLeft, highlightBottomRight);
          });
        }

        // Resetnutí stylů, teď bych to udělal jinak, ale... I mean... funguje
        ["backgroundColor", "boxShadow", "transform"].forEach((prop) => {
          highlightTopLeft.style[prop] = "";
          highlightBottomRight.style[prop] = "";
        });
      }, 300);
    });

    // Při kliknutí scroll na dotyčnou pozici, případně redirect z project page na index
    item.addEventListener("click", () => {

      if (!isGalleryPage) {
        window.scrollTo({
          top: scrollSections[index].top,
          behavior: "smooth",
        });
      }
      else {
        window.location.href = "../index.html";
      }
    });
  });

  // Původní pozice, při načtení stránky.
  window.addEventListener("load", () => {
    const target = isGalleryPage ? items[2] : getCurrentSection(scrollSections).element;
    moveHighlightToElement(target, highlightTopLeft, highlightBottomRight);
    highlightTopLeft.style.opacity = "1";
    highlightBottomRight.style.opacity = "1";
  });

  // Aktualizace pozice při scrollování
  window.addEventListener("scroll", () => {
    if (!lockHighlight) {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          updateHighlightToCurrentSection();
        });
      }, 10);
    }
  });

  
  // Reset funkcionability při změně velikosti obrazovky
  window.addEventListener("resize", () => {
    scrollSections = getScrollSections(deviceRatio);
    requestAnimationFrame(() => {
      updateHighlightToCurrentSection();
    });
  });

  // Nastavení hodnoty při načtení
  window.addEventListener("load", () => {
    requestAnimationFrame(() => {
      scrollSections = getScrollSections(deviceRatio);
      updateHighlightToCurrentSection();
    });
  });
}

// Funkce pro ukládání a získávání scroll pozice
function scrollPosition() {
  // console.log("scrollPosition called");
  if (currentPage === "index.html") {
    window.addEventListener("load", function () {
      
      // Tohle porovná případné dosavadní cookie, které by nám mohlo říkat, kam scrollnout
      const match = document.cookie.match(/(?:^|; )scrollY=([^;]+)/);

      if (match) {
        const scrollY = parseInt(match[1], 10);
        if (!isNaN(scrollY)) window.scrollTo(0, scrollY);
      }
    });

    window.addEventListener("beforeunload", function () {
      const scrollY = window.scrollY;
      document.cookie = `scrollY=${scrollY}`;
    });
    
    document.addEventListener("scroll", function () {
      const scrollY = window.scrollY;
      document.cookie = `scrollY=${scrollY}`;
      console.log("Scroll position saved:", scrollY);
    });
  }
}






















function emailLineExpand() {
  // console.log("emailLineExpand called");
  const line = document.getElementById("email-stroke");
  const trigger = document.getElementById("emaill");
  var length = line.getTotalLength();
  // console.log("Contact line length: " + length);
  trigger.addEventListener("focus", function () {
    line.animate([{ strokeDashoffset: 0 }], {
      duration: 200,
      easing: "ease-in-out",
      fill: "forwards",
    });
  });

  trigger.addEventListener("blur", function () {
    line.animate([{ strokeDashoffset: -70 }], {
      duration: 200,
      easing: "ease-in-out",
      fill: "forwards",
    });
  });
}

function getScrollSections(deviceRatio) {
  // console.log("getScrollSections called");
  const sectionIds = ["home", "about", "gallery", "contact"];
  const navItems = document.querySelectorAll(".nav-bar-item");

  const offsetMap = {
    "4:3": 200,
    "3:2": 200,
    "5:3": 150,
    "16:10": 200,
    "16:9": 100,
    "18:9": 110,
    "19.5:9": 115,
    "20:9": 50,
    "21:9": 50,
    "32:9": 10,
    "1:1": 100,
    "3:5": 1600,     
    "2:3": 1800,     
    "9:16": 1600,     
  };


  const offset = offsetMap[deviceRatio] ?? 90;

  return sectionIds.map((id, index) => {
    const element = document.getElementById(id);
    return {
      name: id,
      top: element ? element.offsetTop - offset : 0,
      element,
      navItem: navItems[index] || null,
    };
  });
}



function getCurrentSection(scrollSections) {
  // console.log("getCurrentSection called");
  const scrollY = window.scrollY;
  let current = scrollSections[scrollSections.length - 1];

  for (let i = 0; i < scrollSections.length; i++) {
    if (scrollY < scrollSections[i].top) {
      current = scrollSections[Math.max(i - 1, 0)];
      break;
    }
  }
  return current;
}


function moveHighlightToElement(
  element,
  highlightTopLeft,
  highlightBottomRight,
  withPadding = false
) {
  // console.log("moveHighlightToElement called with element:", element)
  const rect = element.getBoundingClientRect();
  const container = document.querySelector(".nav-bar-items");

  if (!container) {
    console.error("Missing .nav-bar-items container!");
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const { closestMatch } = getDeviceType();

  const offsetMap = {
    "4:3": 1,
    "3:2": 1,
    "5:3": 1,
    "16:10": 1,
    "16:9": 1,
    "18:9": 1,
    "19.5:9": 1,
    "20:9": 1,
    "21:9": 1,
    "32:9": 1,
    "1:1": 1,
    "3:5": 2,        // New addition
    "2:3": 2,        // New addition
    "9:16": 2,       // Optional
  };



  const offset = vhToPx(withPadding ? (offsetMap[closestMatch] ?? 3) : 0);
  //alert("closestmatch" + closestMatch);

  const leftPx = rect.left - containerRect.left - offset;
  const topPx = rect.top - containerRect.top - offset;
  const rightPx = containerRect.right - rect.right - offset;
  const bottomPx = containerRect.bottom - rect.bottom - offset;

  // Clamp negatives just for safety
  const clamp = (val) => Math.max(0, val);

  highlightTopLeft.style.left = `${pxToVw(clamp(leftPx))}vw`;
  highlightTopLeft.style.top = `${pxToVh(clamp(topPx))}vh`;
  highlightBottomRight.style.right = `${pxToVw(clamp(rightPx))}vw`;
  highlightBottomRight.style.bottom = `${pxToVh(clamp(bottomPx))}vh`;

}


function aboutTransform(config) {
  // console.log("aboutTransform called")
  const {
    textElementIds,
    buttonElementId,
    leftNavId,
    rightNavId,
    texts,
    buttons,
    transitionDuration = 100,
  } = config;

  let index = 0;
  let current = 0;

  const textEls = textElementIds.map((id) => document.getElementById(id));
  const buttonEl = document.getElementById(buttonElementId);
  const leftNav = document.getElementById(leftNavId);
  const rightNav = document.getElementById(rightNavId);

  if (textEls.some((el) => !el) || !buttonEl) {
    console.error("Missing elements.");
    return;
  }

  function showContent(direction) {
    const next = 1 - current;
    const outEl = textEls[current];
    const inEl = textEls[next];

    index =
      (index + (direction === "left" ? -1 : 1) + texts.length) % texts.length;

    inEl.innerHTML = texts[index];

    
    const span = document.createElement("span");
    span.className = "about-button-text";
    span.textContent = buttons[index];
    buttonEl.innerHTML = "";
    buttonEl.appendChild(span);

    
    inEl.className = "about-text";
    outEl.className = "about-text active";

    
    inEl.style.transition = "none";
    inEl.style.transform =
      direction === "left" ? "translateX(-100%)" : "translateX(100%)";
    inEl.style.opacity = "0";
    inEl.style.zIndex = "1";
    void inEl.offsetWidth; 
    inEl.style.transition = ""; 

    
    outEl.classList.add(
      direction === "left" ? "slide-out-right" : "slide-out-left"
    );
    inEl.classList.add(
      direction === "left" ? "slide-in-left" : "slide-in-right",
      "active"
    );
    span.classList.add("active");

    
    setTimeout(() => {
      outEl.className = "about-text";
      outEl.style.zIndex = "0";
      outEl.style.opacity = "0";
      outEl.style.transform =
        direction === "left" ? "translateX(100%)" : "translateX(-100%)";

      inEl.className = "about-text active";
      inEl.style.zIndex = "1";
      inEl.style.opacity = "1";
      inEl.style.transform = "translateX(0)";

      span.className = "about-button-text active";

      current = next;
    }, transitionDuration);


        // === Mobile Swipe Gesture Support ===
    let touchStartX = 0;
    let touchEndX = 0;
    function handleGesture() {
      if (touchEndX < touchStartX - 50) {
        showContent("right");
      } else if (touchEndX > touchStartX + 50) {
        showContent("left");

      }
    }

    document.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleGesture();
    });

  }



  
  textEls[0].innerHTML = texts[index];
  textEls[0].classList.add("active");

  const initialSpan = document.createElement("span");
  initialSpan.className = "about-button-text active";
  initialSpan.textContent = buttons[index];
  buttonEl.innerHTML = "";
  buttonEl.appendChild(initialSpan);


  if (leftNav) leftNav.onclick = () => showContent("left");
  if (rightNav) rightNav.onclick = () => showContent("right");
}


function setupHoverExpansion(deviceRatio) {
  // console.log("setupHoverExpansion called");
  const ontrigger = document.querySelector('.footer');
  const navBar = document.querySelector('.nav-bar');
  const socialsDiv = document.querySelector('.socials-div');
  const contactPage = document.querySelector('.contact-page');

  const navButton = document.querySelector(".nav-bar-button");
  const body = document.body;

  const device = deviceRatio.index ?? 4;


  const CLASS_EXPANDED = 'expanded';
  const CLASS_HIDDEN = 'display-none';
  const CLASS_NO_SCROLL = 'overflow-hidden';
  const CLASS_NO_POINTER = 'pointer-events-none';

  let isLocked = false;

  if (!ontrigger || !navBar || !socialsDiv || !contactPage) {
    console.error('Required elements not found for setupHoverExpansion');
  }
  
  function openSocials() {
    // console.log("openSocials called");
    if (device < 5) {
      navButton.style.display = 'none';
    }
    ontrigger.classList.add("footer-fixed")
    navBar.classList.add(CLASS_EXPANDED);
    socialsDiv.classList.remove(CLASS_HIDDEN);
    body.classList.add(CLASS_NO_SCROLL);

    if (contactPage) {
      contactPage.classList.add(CLASS_NO_POINTER);
    }
    
  }

  function closeSocials() {
    // console.log("closeSocials called");
    if (device < 5) {
      navButton.style.display = 'flex';
    }
    ontrigger.classList.remove("footer-fixed")
    body.classList.remove(CLASS_NO_SCROLL);
    socialsDiv.classList.add(CLASS_HIDDEN);
    navBar.classList.remove(CLASS_EXPANDED);
    if (contactPage) {
      contactPage.classList.add(CLASS_NO_POINTER);
    }
  }
  getDeviceType
  ontrigger.addEventListener('click', () => {
    isLocked = !isLocked;
    isLocked ? openSocials() : closeSocials();
  });
}

function mobileNavbarExpand(deviceRatio) {
  // console.log("mobileNavbarExpand called");
  const navbar = document.getElementById("nav-bar");
  const polygon = document.querySelector(".nav-bar-polygon");
  const items = document.querySelectorAll(".nav-bar-items");
  const navButton = document.querySelector(".nav-bar-button");

  const device = deviceRatio.index ?? 4;
  
  if (device < 4) {

    navbar.style.cursor = "pointer";
    let clicked = false;
    items.forEach(item => item.classList.add("display-none"));

    navbar.addEventListener("click", () => {
      if (navbar.classList.contains("expanded")) return;

      clicked = !clicked;
      if (clicked) {
        navbar.style.cursor = "auto";
        navButton.style.display = 'none';
        polygon.style.height = '100vh';
        navbar.classList.add("nav-bar-clicked");
        items.forEach(item => item.classList.remove("display-none"));

      } else {
        navbar.style.cursor = "pointer";
        navButton.style.display = 'flex';
        items.forEach(item => item.classList.add("display-none"));
        navbar.classList.remove("nav-bar-clicked");
        polygon.style.height = '10vh';
      }
    });
  }
}



function enableGalleryCornerAnimation() {
  // console.log("enableGalleryCornerAnimation called");
  const items = document.querySelectorAll('.gallery-item');

  items.forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.classList.add('hovering');
    });

    item.addEventListener('mouseleave', () => {
      item.classList.remove('hovering');
    });
  });
}





// Po načtení stránky se spustí postupně všechny tyhle funkce
document.addEventListener("DOMContentLoaded", function () {
  const deviceType = getDeviceType();
  console.log("aspectRatio " + deviceType.ratio + " (" + deviceType.closestMatch + ")" + " index: " + deviceType.index);

  setupNavbar(deviceType.closestMatch);
  scrollPosition();


  if (deviceType.closestMatch === "16:9") {
    emailLineExpand();
  }


  

  setupHoverExpansion(deviceType);
  mobileNavbarExpand(deviceType);


  if (currentPage === "index.html") {
    enableGalleryCornerAnimation();

    

    aboutTransform({
      textElementIds: [
        "about-text-a",
        "about-text-b"
      ],
      buttonElementId: "button-me",
      leftNavId: "about-nav-left",
      rightNavId: "about-nav-right",
      texts:[
        "<div class=about-text-a>Oskrrr - Just a guy</div><img class=about-image-a src=images/about/about_me.JPG>",
        "Workk",
        "Hobbies",
        "School"
      ],
      buttons: [
        "Me",
        "My Work",
        "My Hobbies",
        "My School"
      ]
    });
  }


});
