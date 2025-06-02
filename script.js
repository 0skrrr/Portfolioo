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
};
function pxToVh(px) {
  // console.log("pxToVh called with px:", px);
  return (px / window.innerHeight) * 100;
};
function vhToPx(vh) {
  // console.log("vhToPx called with vh:", vh);
  return (vh / 100) * window.innerHeight;
};


// Funkce pro získání typu zařízení na základě poměru stran obrazovky
function getDeviceType() {
  console.log("getDeviceType called");
  
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
  const closest = knownRatios.reduce(function (first, second) {
    return Math.abs(second.ratio - aspectRatio) < Math.abs(first.ratio - aspectRatio) ? second : first;
  });

  return {
    ratio: aspectRatio,
    closestMatch: closest.label,
    index: closest.index,
  };
};


// Funkce pro fungování navbaru
function navbar(deviceRatio) {
  console.log("navbar called");

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
      };
      const currentSection = currentScroll(scrollSections);
      if (currentSection.navItem) {
        moveHighlightToElement(currentSection.navItem, highlightTopLeft, highlightBottomRight);
      };
    };
  };

  // Při hover na item se highlights přesunou na něj
  items.forEach(function (item, index) {
    item.addEventListener("mouseenter", function () {
      isHovering = true;
      lockHighlight = true;
      clearTimeout(hoverTimeout);
      moveHighlightToElement(item, highlightTopLeft, highlightBottomRight, true);
    });

    // A při ukončení hover se vrátí zpět
    item.addEventListener("mouseleave", function () {
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout( function () {
        isHovering = false;
        lockHighlight = false;

        if (isGalleryPage) {
          moveHighlightToElement(items[2], highlightTopLeft, highlightBottomRight);
        } else {
          requestAnimationFrame( function () {
            scrollSections = getScrollSections(deviceRatio);
            const currentSection = currentScroll(scrollSections);
            const navItem = currentSection?.navItem;
            moveHighlightToElement(navItem, highlightTopLeft, highlightBottomRight);
          });
        };

        // Resetnutí stylů, teď bych to udělal jinak, ale... I mean... funguje
        ["backgroundColor", "boxShadow", "transform"].forEach( function (prop) {
          highlightTopLeft.style[prop] = "";
          highlightBottomRight.style[prop] = "";
        });
      }, 300);
    });

    // Při kliknutí scroll na dotyčnou pozici, případně redirect z project page na index.
    // Pokud se klikne na item, pokud jsou socials otevřené, musí to nejdřív zavřít socials, a potom až scrollnout
    item.addEventListener("click", function () {
      if (isGalleryPage) {
        window.location.href = "../index.html";
        return;
      }

      const targetTop = scrollSections[index].top;

      if (!document.querySelector(".socials-div").classList.contains("display-none")) {

        const deviceType = getDeviceType();
        socialsExpand(deviceType,1);
        setTimeout(function () {
          window.scrollTo({ top: targetTop, behavior: "smooth" });
        }, 100);

      } else {
        window.scrollTo({ top: targetTop, behavior: "smooth" });
      }
    });
  });

  // Původní pozice, při načtení stránky.
  window.addEventListener("load", function () {
    const target = isGalleryPage ? items[2] : currentScroll(scrollSections).element;
    moveHighlightToElement(target, highlightTopLeft, highlightBottomRight);
    highlightTopLeft.style.opacity = "1";
    highlightBottomRight.style.opacity = "1";
  });

  // Aktualizace pozice při scrollování
  window.addEventListener("scroll", function () {
    if (!lockHighlight) {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout( function () {
        requestAnimationFrame( function () {
          updateHighlightToCurrentSection();
        });
      }, 10);
    };
  });

  // Reset funkcionability při změně velikosti obrazovky
  window.addEventListener("resize", function ()  {
    scrollSections = getScrollSections(deviceRatio);
    requestAnimationFrame( function () {
      updateHighlightToCurrentSection();
    });
  });

  // Nastavení hodnoty při načtení
  window.addEventListener("load", function () {
    requestAnimationFrame(function () {
      scrollSections = getScrollSections(deviceRatio);
      updateHighlightToCurrentSection();
    });
  });
};


// Funkce vykonávající ten pohyb highlight elementů, a také jejich správné umístění
function moveHighlightToElement(
  element,
  highlightTopLeft,
  highlightBottomRight,
  withPadding = false
) {
  console.log("moveHighlightToElement called with element:", element);
  
  // Získání pozicových (a velikostních) informací elementu, ke kterému se budeme hýbat
  const rect = element.getBoundingClientRect();

  const container = document.querySelector(".nav-bar-items");

  const containerRect = container.getBoundingClientRect();
  const { closestMatch } = getDeviceType();

  // Další matice, kde jsou různé offsety pro highlights podle poměru obrazovky
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
    "3:5": 2,       
    "2:3": 2,      
    "9:16": 2,    
  };

  // Tohle zajistí oddálení highlights od položky nav-baru, pokud tu položku hoverujeme
  const offset = vhToPx(withPadding ? (offsetMap[closestMatch] ?? 3) : 0);

  // Vypočítání pozice a offsetu
  // Zjistíme, jak daleko je item od okraje 
  const leftPx = rect.left - containerRect.left - offset;
  const topPx = rect.top - containerRect.top - offset;
  const rightPx = containerRect.right - rect.right - offset;
  const bottomPx = containerRect.bottom - rect.bottom - offset;


  // Přiřazení pozicových údajů, a ještě jejich převedení, které vlastně není až tak essential
  highlightTopLeft.style.left = `${pxToVw(leftPx)}vw`;
  highlightTopLeft.style.top = `${pxToVh(topPx)}vh`;
  highlightBottomRight.style.right = `${pxToVw(rightPx)}vw`;
  highlightBottomRight.style.bottom = `${pxToVh(bottomPx)}vh`;
}



// Funkce určující, podle jakých offsetů budeme fungovat na konkrétním poměru stránky
function getScrollSections(deviceRatio) {
  console.log("getScrollSections called");

  const sectionIds = ["home", "about", "gallery", "contact"];
  const navItems = document.querySelectorAll(".nav-bar-item");

  // Pro různé poměry obrazovky potřebuju různé offsety při scrollování. 
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
    "9:16": 1000,     
  };

  const offset = offsetMap[deviceRatio] ?? 90;
  
  return sectionIds.map(function (id, index) {
    const element = document.getElementById(id);
    return {
      name: id,
      // Výpočet
      top: element ? element.offsetTop - offset : 0,
      element,
      navItem: navItems[index] || null,
    };
  });
}


// Funkce určující, v jaké sekci stránky se zrovna nacházíme, má jako parametr informace z předchozí funkce
function currentScroll(scrollSections) {
  console.log("currentScroll called");

  const scrollY = window.scrollY;
  let current = scrollSections[scrollSections.length - 1];

  // Výpočet
  for (let i = 0; i < scrollSections.length; i++) {
    if (scrollY < scrollSections[i].top) {
      current = scrollSections[Math.max(i - 1, 0)];
      break;
    }
  }
  return current;
}




// Funkce pro mobilní verzi nav baru
function mobileNavbar(deviceRatio) {
  console.log("mobileNavbar called");

  const navbar = document.getElementById("nav-bar");
  const polygon = document.querySelector(".nav-bar-polygon");
  const items = document.querySelectorAll(".nav-bar-items");
  const navButton = document.querySelector(".nav-bar-button");

  const device = deviceRatio.index ?? 4;
  
  // Pokud je zařízení mobilního poměru obrazovky, nastaví to správné styly a třídy
  if (device < 4) {

    navbar.style.cursor = "pointer";
    let clicked = false;

    items.forEach(function (item) {
      item.classList.add("display-none");
    });

    navbar.addEventListener("click", function () {
      if (navbar.classList.contains("expanded")) return;

      clicked = !clicked;
      if (clicked) {
        navbar.style.cursor = "auto";
        navButton.style.display = "none";
        polygon.style.height = "100vh";
        navbar.classList.add("nav-bar-clicked");
        items.forEach(function (item) {
          item.classList.remove("display-none");
        });

      } else {
        navbar.style.cursor = "pointer";
        navButton.style.display = "flex";
        items.forEach((function(item) {
          item.classList.add("display-none");
        }));
        navbar.classList.remove("nav-bar-clicked");
        polygon.style.height = "10vh";
      }
    });
  }
}

// Funkce pro ukládání a získávání scroll pozice
function scrollPosition() {
  console.log("scrollPosition called");
  if (currentPage === "index.html") {
    window.addEventListener("load", function () {
      
      // Tohle porovná případné dosavadní cookie, které by nám mohlo říkat, kam scrollnout
      
      const match = document.cookie.split('scrollY=')[1]?.split(';')[0];
      if (match) {
        const scrollY = parseInt(match);
        if (!isNaN(scrollY)) window.scrollTo(0, scrollY);
      }
    });

    // Uložení scroll hodnoty do cookie, buď při scrollování, nebo těsně před opuštěním stránky
    window.addEventListener("beforeunload", function () {
      const scrollY = window.scrollY;
      document.cookie = `scrollY=${scrollY}`;
    });
    
    document.addEventListener("scroll", function () {
      const scrollY = window.scrollY;
      document.cookie = `scrollY=${scrollY}`;
      console.log("ScrollY:", scrollY);
    });
  }
}

//  Funkce pro zvětšování nav-baru, aby se mohla zobrazit socials sekce
function socialsExpand(deviceRatio, fromNavBar) {
  console.log("socialsExpand called");
  
  const ontrigger = document.querySelector(".footer");
  const navBar = document.querySelector(".nav-bar");
  const socialsDiv = document.querySelector(".socials-div");
  const contactPage = document.querySelector(".contact-page");

  const navButton = document.querySelector(".nav-bar-button");
  const body = document.body;

  const device = deviceRatio.index ?? 4;
  let state = false;

  if (!ontrigger || !navBar || !socialsDiv || !contactPage) {
    console.error("Required elements not found for socialsExpand");
  }

  //Funkce, která nastaví styly pro otevření socials
  function openSocials() {
    console.log("openSocials called");

    // Pokud mobil, zmizí ten trigger čudlík
    if (device < 5) {
      navButton.style.display = "none";
    }

    ontrigger.classList.add("footer-fixed");
    navBar.classList.add("expanded");
    socialsDiv.classList.remove("display-none");
    body.classList.add("overflow-hidden");
  
    document.querySelector(".hero-page").style.display = "none";
    document.querySelector(".about-page").style.display = "none";
    document.querySelector(".gallery-page").style.display = "none";
    document.querySelector(".contact-page").style.display = "none";
  }

  //Funkce, která nastaví styly pro zavření socials
  function closeSocials() {
    console.log("closeSocials called");

    // Pokud mobil, objeví se ten trigger čudlík
    if (device < 5) {
      navButton.style.display = "flex";
    }

    ontrigger.classList.remove("footer-fixed");
    body.classList.remove("overflow-hidden");
    socialsDiv.classList.add("display-none");
    navBar.classList.remove("expanded");
    document.querySelector(".hero-page").style.display = "";
    document.querySelector(".about-page").style.display = "";
    document.querySelector(".gallery-page").style.display = "";
    document.querySelector(".contact-page").style.display = "";

    // Jiné chování, když výzva k zavření přijde z nav baru
    if (fromNavBar === 0) {
      console.warn("fromNavahhdj" + fromNavBar)
      window.scrollTo({ top: 100000});
    }
  }

  // Jiné chování, když výzva k zavření přijde z nav baru
  if (fromNavBar === 1) {
    closeSocials(1);
  }

  // Při kliknutí na footer to zavolá vždy opačnou funkci, takže buď otevře nebo zavře ten socials part
  ontrigger.addEventListener("click", function () {
    state = !state;
    state ? openSocials() : closeSocials(0);
  });
}



// Funkce pro překlikávání obsahu About sekce, bere si jako parametry html strukturu pro content, plus string texty pro button
function about(config) {
  const {
    textElementIds,
    buttonElementId,
    leftNavId,
    rightNavId,
    texts,
    buttons,
    transitionDuration = 10,
  } = config;

  let index = 0;
  let current = 0;

  const textEls = [
    document.getElementById(textElementIds[0]),
    document.getElementById(textElementIds[1])
  ];
  const buttonEl = document.getElementById(buttonElementId);
  const leftNav = document.getElementById(leftNavId);
  const rightNav = document.getElementById(rightNavId);

  if (!textEls[0] || !textEls[1] || !buttonEl || !leftNav || !rightNav) {
    console.error("Missing elements.");
    return;
  }

  function updateButton() {
    // Absolutně nechápu, proč tu musí být single quotes... proč to nemůže být stejně jako všechno ostatníí?
    buttonEl.innerHTML = '<span class="about-button-text active">' + buttons[index] + '</span>';
  }

  function showContent(direction) {
    const next = 1 - current;
    const outEl = textEls[current];
    const inEl = textEls[next];

    index = (index + (direction === "left" ? -1 : 1) + texts.length) % texts.length;

    inEl.innerHTML = texts[index];
    updateButton();

    inEl.className = "about-text";
    inEl.style.transition = "none";
    inEl.style.transform = direction === "left" ? "translateX(-100%)" : "translateX(100%)";
    inEl.style.opacity = "0";
    inEl.style.zIndex = "1";
    void inEl.offsetWidth;
    inEl.style.transition = "";

    outEl.classList.add(direction === "left" ? "slide-out-right" : "slide-out-left");
    inEl.classList.add(direction === "left" ? "slide-in-left" : "slide-in-right", "active");

    setTimeout(function () {
      outEl.className = "about-text";
      outEl.style.zIndex = "0";
      outEl.style.opacity = "0";
      outEl.style.transform = direction === "left" ? "translateX(100%)" : "translateX(-100%)";

      inEl.className = "about-text active";
      inEl.style.zIndex = "1";
      inEl.style.opacity = "1";
      inEl.style.transform = "translateX(0)";

      current = next;
    }, transitionDuration);
  }

  // Initial setup
  textEls[current].innerHTML = texts[index];
  textEls[current].className = "about-text active";
  updateButton();

  // Click events
  leftNav.onclick = function () {
    showContent("left");
  };
  rightNav.onclick = function () {
    showContent("right");
  };
}

// Funkce pro automatické zasílání emailu, obsahuje speciální příkazy
// Jeden mě, jeden tomu, kdo to poslal
function emailSend (emailCookie) {
  function Send () {
    const email = document.getElementById("emaill").value;
    const message = document.getElementById("contact-message").value;
    emailjs.send("8267628902994824", "template_q8zp78o", {
      email:email,
      message:message
    });
    emailjs.send("8267628902994824", "template_arf9rga", {
      email:email,
      message:message
    });
    emailCookie++;
    document.cookie = "Email=" + emailCookie;
  }
  emailjs.init("Aq25gB-YP1glON6CK");
  document.querySelectorAll(".send-button").forEach(function (button) {
    button.addEventListener("click", Send);
  });
}




// Funkce pro trošku jiný způsob / styl dělání té reaktivní email čáry.
// Kvůli tomu, jak to funguje, to mám povolené jenom na jedno konkrétním poměru obrazovky.
function emailLineExpand() {
  console.log("emailLineExpand called");

  const line = document.getElementById("email-stroke");
  const trigger = document.getElementById("emaill");

  // Animace při psaní
  trigger.addEventListener("focus", function () {
    line.animate([{ strokeDashoffset: 0 }], {
      duration: 500,
      easing: "ease-in-out",
      fill: "forwards",
    });
  });

  // Animace při ukončení psaní
  trigger.addEventListener("blur", function () {
    line.animate([{ strokeDashoffset: -70 }], {
      duration: 500,
      easing: "ease-in-out",
      fill: "forwards",
    });
  });
};

// Velmi jednoduchá funkce, která nastaví správné třídy pro položky galerie, aby se na-animovaly rohy při hover
function enableGalleryCornerAnimation() {
  console.log("enableGalleryCornerAnimation called");
  const items = document.querySelectorAll(".gallery-item");

  items.forEach(function (item) {
    item.addEventListener("mouseenter", function () {
      item.classList.add("hovering");
    });

    item.addEventListener("mouseleave", function () {
      item.classList.remove("hovering");
    });
  });
};

// Funkce volající všechny funkce. Existuje proto, abych ji mohl volat v několika scenáriích (resize,onload), místo toho abych to tam měl několikrát celé
function allFunctions() {
  console.warn("1");
  const deviceType = getDeviceType();
  console.warn("2");
  console.log("aspectRatio " + deviceType.ratio + " (" + deviceType.closestMatch + ")" + " index: " + deviceType.index);
  console.warn("3");
  navbar(deviceType.closestMatch);
  console.warn("4");
  mobileNavbar(deviceType);
  console.warn("5");
  scrollPosition();
  console.warn("6");
  socialsExpand(deviceType,0);
  console.warn("6.1");

  // Spuštění funkcí, které mají použití jenom na hlavní stránce
  if (currentPage === "" || currentPage === "index.html") {
    console.warn("7");


    // Vložení variací kodu pro about page
    about({
      textElementIds: [
        "about-text-a",
        "about-text-b"
      ],
      buttonElementId: "button-me",
      leftNavId: "about-nav-left",
      rightNavId: "about-nav-right",

      // Tady taky musí v tom alt být single qutoes... proč, to nevím, ale nezajímá mě to natolik, abych si o tom něco zjistil
      texts: [
        "<div class=about-text-a>Oskrrr - Thats mee. Im 16 years old guy living in Czech Republic.</div><img class=about-image-a alt='If there isn&#39;t my photo, use your imagination' src=images/about/about_me.JPG>",
        "<div class=about-text-a>I haven´t yet developed some work identity. You can be the one who will give me an opportunity to change that</div>",
        "I like to do a lot of stuff. Gaming, music, FPV drone flying, movies (Christopher Nolan is the best), coding, hiking, camping, and so much more.",
        "<div class=about-text-a>I am a student at CreativeHillCollege, studying development. Choosing to go to this school was (still is) one of the best decisions of my life. Yes, some things we learn are very, like very boring. But big majority is actually pretty fun.</div><img class=about-image-a alt='If there isn&#39;t my photo, use your imagination' src=images/about/chc.png>"
      ],
      buttons: [
        "Me",
        "My Work",
        "My Hobbies",
        "My School"
      ]
    });
    console.warn("7.1");

    // Vytvořeno v den odevzdání, protože mě spolužáci zaspamovali sedm seti e-maily.
    var emailCookie = document.cookie.split("Email=")[1]?.split(";")[0];
    console.warn("7.1");
    console.error("Email cookie value: " + emailCookie);
    if (emailCookie === undefined) {
      console.error("Email cookie not found, setting to 0");
      emailCookie = 0;
    }
    if (emailCookie < 2) {
      emailSend(emailCookie);
      console.error("Email cookie set to: " + emailCookie);
    }


    if (deviceType.closestMatch === "16:9" || deviceType.closestMatch === "19.5:9") {
      console.warn("7.1.1");
      emailLineExpand();
      console.warn("7.2");
    }
    console.warn("8");
    enableGalleryCornerAnimation();
    console.warn("9");
  }
  console.warn("10");
};

// Po načtení stránky se spustí všechno
document.addEventListener("DOMContentLoaded", function () {
  console.warn("Onload spouštěč");
  allFunctions();
});
