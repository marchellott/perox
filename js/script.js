//juxtapose
(function (document, window) {
    var juxtapose = {
      sliders: [],
      OPTIMIZATION_ACCEPTED: 1,
      OPTIMIZATION_WAS_CONSTRAINED: 2
    };
    var flickr_key = "d90fc2d1f4acc584e08b8eaea5bf4d6c";
    var FLICKR_SIZE_PREFERENCES = ["Large", "Medium"];
  
    function Graphic(properties, slider) {
      var self = this;
      this.image = new Image();
      this.loaded = false;
      this.image.onload = function () {
        self.loaded = true;
        slider._onLoaded();
      };
      this.image.src = properties.src;
      this.image.alt = properties.alt || "";
      this.label = properties.label || false;
      this.credit = properties.credit || false;
    }
  
    function FlickrGraphic(properties, slider) {
      var self = this;
      this.image = new Image();
      this.loaded = false;
      this.image.onload = function () {
        self.loaded = true;
        slider._onLoaded();
      };
      this.flickrID = this.getFlickrID(properties.src);
      this.callFlickrAPI(this.flickrID, self);
      this.label = properties.label || false;
      this.credit = properties.credit || false;
    }
    FlickrGraphic.prototype = {
      getFlickrID: function (url) {
        if (url.match(/flic.kr\/.+/i)) {
          var encoded = url.split("/").slice(-1)[0];
          return base58Decode(encoded);
        }
        var idx = url.indexOf("flickr.com/photos/");
        var pos = idx + "flickr.com/photos/".length;
        var photo_info = url.substr(pos);
        if (photo_info.indexOf("/") == -1) return null;
        if (photo_info.indexOf("/") === 0) photo_info = photo_info.substr(1);
        id = photo_info.split("/")[1];
        return id;
      },
      callFlickrAPI: function (id, self) {
        var url =
          "https://api.flickr.com/services/rest/?method=flickr.photos.getSizes" +
          "&api_key=" +
          flickr_key +
          "&photo_id=" +
          id +
          "&format=json&nojsoncallback=1";
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.onload = function () {
          if (request.status >= 200 && request.status < 400) {
            data = JSON.parse(request.responseText);
            var flickr_url = self.bestFlickrUrl(data.sizes.size);
            self.setFlickrImage(flickr_url);
          } else {
            console.error("There was an error getting the picture from Flickr");
          }
        };
        request.onerror = function () {
          console.error("There was an error getting the picture from Flickr");
        };
        request.send();
      },
      setFlickrImage: function (src) {
        this.image.src = src;
      },
      bestFlickrUrl: function (ary) {
        var dict = {};
        for (var i = 0; i < ary.length; i++) {
          dict[ary[i].label] = ary[i].source;
        }
        for (var j = 0; j < FLICKR_SIZE_PREFERENCES.length; j++) {
          if (FLICKR_SIZE_PREFERENCES[j] in dict) {
            return dict[FLICKR_SIZE_PREFERENCES[j]];
          }
        }
        return ary[0].source;
      }
    };
  
    function getNaturalDimensions(DOMelement) {
      if (DOMelement.naturalWidth && DOMelement.naturalHeight) {
        return {
          width: DOMelement.naturalWidth,
          height: DOMelement.naturalHeight
        };
      }
      var img = new Image();
      img.src = DOMelement.src;
      return {
        width: img.width,
        height: img.height
      };
    }
  
    function getImageDimensions(img) {
      var dimensions = {
        width: getNaturalDimensions(img).width,
        height: getNaturalDimensions(img).height,
        aspect: function () {
          return this.width / this.height;
        }
      };
      return dimensions;
    }
  
    function addClass(element, c) {
      if (element.classList) {
        element.classList.add(c);
      } else {
        element.className += " " + c;
      }
    }
  
    function removeClass(element, c) {
      element.className = element.className
        .replace(/(\S+)\s*/g, function (w, match) {
          if (match === c) {
            return "";
          }
          return w;
        })
        .replace(/^\s+/, "");
    }
  
    function setText(element, text) {
      if (document.body.textContent) {
        element.textContent = text;
      } else {
        element.innerText = text;
      }
    }
  
    function getComputedWidthAndHeight(element) {
      if (window.getComputedStyle) {
        return {
          width: parseInt(getComputedStyle(element).width, 10),
          height: parseInt(getComputedStyle(element).height, 10)
        };
      } else {
        w =
          element.getBoundingClientRect().right -
          element.getBoundingClientRect().left;
        h =
          element.getBoundingClientRect().bottom -
          element.getBoundingClientRect().top;
        return {
          width: parseInt(w, 10) || 0,
          height: parseInt(h, 10) || 0
        };
      }
    }
  
    function viewport() {
      var e = window,
        a = "inner";
      if (!("innerWidth" in window)) {
        a = "client";
        e = document.documentElement || document.body;
      }
      return {
        width: e[a + "Width"],
        height: e[a + "Height"]
      };
    }
  
    function getPageX(e) {
      var pageX;
      if (e.pageX) {
        pageX = e.pageX;
      } else if (e.touches) {
        pageX = e.touches[0].pageX;
      } else {
        pageX =
          e.clientX +
          document.body.scrollLeft +
          document.documentElement.scrollLeft;
      }
      return pageX;
    }
  
    function getPageY(e) {
      var pageY;
      if (e.pageY) {
        pageY = e.pageY;
      } else if (e.touches) {
        pageY = e.touches[0].pageY;
      } else {
        pageY =
          e.clientY +
          document.body.scrollTop +
          document.documentElement.scrollTop;
      }
      return pageY;
    }
  
    function checkFlickr(url) {
      if (url.match(/flic.kr\/.+/i)) {
        return true;
      }
      var idx = url.indexOf("flickr.com/photos/");
      if (idx == -1) {
        return false;
      } else {
        return true;
      }
    }
  
    function base58Decode(encoded) {
      var alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
        base = alphabet.length;
      if (typeof encoded !== "string") {
        throw '"base58Decode" only accepts strings.';
      }
      var decoded = 0;
      while (encoded) {
        var alphabetPosition = alphabet.indexOf(encoded[0]);
        if (alphabetPosition < 0) {
          throw (
            '"base58Decode" can\'t find "' +
            encoded[0] +
            '" in the alphabet: "' +
            alphabet +
            '"'
          );
        }
        var powerOf = encoded.length - 1;
        decoded += alphabetPosition * Math.pow(base, powerOf);
        encoded = encoded.substring(1);
      }
      return decoded.toString();
    }
  
    function getLeftPercent(slider, input) {
      if (typeof input === "string" || typeof input === "number") {
        leftPercent = parseInt(input, 10);
      } else {
        var sliderRect = slider.getBoundingClientRect();
        var offset = {
          top:
            sliderRect.top +
            document.body.scrollTop +
            document.documentElement.scrollTop,
          left:
            sliderRect.left +
            document.body.scrollLeft +
            document.documentElement.scrollLeft
        };
        var width = slider.offsetWidth;
        var pageX = getPageX(input);
        var relativeX = pageX - offset.left;
        leftPercent = (relativeX / width) * 100;
      }
      return leftPercent;
    }
  
    function getTopPercent(slider, input) {
      if (typeof input === "string" || typeof input === "number") {
        topPercent = parseInt(input, 10);
      } else {
        var sliderRect = slider.getBoundingClientRect();
        var offset = {
          top:
            sliderRect.top +
            document.body.scrollTop +
            document.documentElement.scrollTop,
          left:
            sliderRect.left +
            document.body.scrollLeft +
            document.documentElement.scrollLeft
        };
        var width = slider.offsetHeight;
        var pageY = getPageY(input);
        var relativeY = pageY - offset.top;
        topPercent = (relativeY / width) * 100;
      }
      return topPercent;
    }
    var BOOLEAN_OPTIONS = {
      animate: true,
      showLabels: true,
      showCredits: true,
      makeResponsive: true
    };
  
    function interpret_boolean(x) {
      if (typeof x != "string") {
        return Boolean(x);
      }
      return !(x === "false" || x === "");
    }
  
    function JXSlider(selector, images, options) {
      this.selector = selector;
      var i;
      this.options = {
        animate: true,
        showLabels: true,
        showCredits: true,
        makeResponsive: true,
        startingPosition: "50%",
        mode: "horizontal",
        callback: null
      };
      for (i in this.options) {
        if (i in options) {
          if (i in BOOLEAN_OPTIONS) {
            this.options[i] = interpret_boolean(options[i]);
          } else {
            this.options[i] = options[i];
          }
        }
      }
      if (images.length == 2) {
        if (checkFlickr(images[0].src)) {
          this.imgBefore = new FlickrGraphic(images[0], this);
        } else {
          this.imgBefore = new Graphic(images[0], this);
        }
        if (checkFlickr(images[1].src)) {
          this.imgAfter = new FlickrGraphic(images[1], this);
        } else {
          this.imgAfter = new Graphic(images[1], this);
        }
      } else {
        console.warn("The images parameter takes two Image objects.");
      }
      if (this.imgBefore.credit || this.imgAfter.credit) {
        this.options.showCredits = true;
      } else {
        this.options.showCredits = false;
      }
    }
    JXSlider.prototype = {
      updateSlider: function (input, animate) {
        var leftPercent, rightPercent;
        if (this.options.mode === "vertical") {
          leftPercent = getTopPercent(this.slider, input);
        } else {
          leftPercent = getLeftPercent(this.slider, input);
        }
        leftPercent = leftPercent.toFixed(2) + "%";
        leftPercentNum = parseFloat(leftPercent);
        rightPercent = 100 - leftPercentNum + "%";
        if (leftPercentNum > 0 && leftPercentNum < 100) {
          removeClass(this.handle, "transition");
          removeClass(this.rightImage, "transition");
          removeClass(this.leftImage, "transition");
          if (this.options.animate && animate) {
            addClass(this.handle, "transition");
            addClass(this.leftImage, "transition");
            addClass(this.rightImage, "transition");
          }
          if (this.options.mode === "vertical") {
            this.handle.style.top = leftPercent;
            this.leftImage.style.height = leftPercent;
            this.rightImage.style.height = rightPercent;
          } else {
            this.handle.style.left = leftPercent;
            this.leftImage.style.width = leftPercent;
            this.rightImage.style.width = rightPercent;
          }
          this.sliderPosition = leftPercent;
        }
      },
      getPosition: function () {
        return this.sliderPosition;
      },
      displayLabel: function (element, labelText) {
        label = document.createElement("div");
        label.className = "jx-label";
        label.setAttribute("tabindex", 0);
        setText(label, labelText);
        element.appendChild(label);
      },
      displayCredits: function () {
        credit = document.createElement("div");
        credit.className = "jx-credit";
        text = "<em>Photo Credits:</em>";
        if (this.imgBefore.credit) {
          text += " <em>Before</em> " + this.imgBefore.credit;
        }
        if (this.imgAfter.credit) {
          text += " <em>After</em> " + this.imgAfter.credit;
        }
        credit.innerHTML = text;
        this.wrapper.appendChild(credit);
      },
      setStartingPosition: function (s) {
        this.options.startingPosition = s;
      },
      checkImages: function () {
        if (
          getImageDimensions(this.imgBefore.image).aspect() ==
          getImageDimensions(this.imgAfter.image).aspect()
        ) {
          return true;
        } else {
          return false;
        }
      },
      calculateDims: function (width, height) {
        var ratio = getImageDimensions(this.imgBefore.image).aspect();
        if (width) {
          height = width / ratio;
        } else if (height) {
          width = height * ratio;
        }
        return {
          width: width,
          height: height,
          ratio: ratio
        };
      },
      responsivizeIframe: function (dims) {
        if (dims.height < window.innerHeight) {
          if (dims.ratio >= 1) {
            this.wrapper.style.paddingTop =
              parseInt((window.innerHeight - dims.height) / 2) + "px";
          }
        } else if (dims.height > window.innerHeight) {
          dims = this.calculateDims(0, window.innerHeight);
          this.wrapper.style.paddingLeft =
            parseInt((window.innerWidth - dims.width) / 2) + "px";
        }
        if (this.options.showCredits) {
          dims.height -= 13;
        }
        return dims;
      },
      setWrapperDimensions: function () {
        var wrapperWidth = getComputedWidthAndHeight(this.wrapper).width;
        var wrapperHeight = getComputedWidthAndHeight(this.wrapper).height;
        var dims = this.calculateDims(wrapperWidth, wrapperHeight);
        if (
          window.location !== window.parent.location &&
          !this.options.makeResponsive
        ) {
          dims = this.responsivizeIframe(dims);
        }
      },
      optimizeWrapper: function (maxWidth) {
        var result = juxtapose.OPTIMIZATION_ACCEPTED;
        if (
          this.imgBefore.image.naturalWidth >= maxWidth &&
          this.imgAfter.image.naturalWidth >= maxWidth
        ) {
          this.wrapper.style.width = maxWidth + "px";
          result = juxtapose.OPTIMIZATION_WAS_CONSTRAINED;
        } else if (this.imgAfter.image.naturalWidth < maxWidth) {
          this.wrapper.style.width = this.imgAfter.image.naturalWidth + "px";
        } else {
          this.wrapper.style.width = this.imgBefore.image.naturalWidth + "px";
        }
        this.setWrapperDimensions();
        return result;
      },
      _onLoaded: function () {
        if (
          this.imgBefore &&
          this.imgBefore.loaded === true &&
          this.imgAfter &&
          this.imgAfter.loaded === true
        ) {
          this.wrapper = document.querySelector(this.selector);
          addClass(this.wrapper, "juxtapose");
          this.wrapper.style.width = getNaturalDimensions(
            this.imgBefore.image
          ).width;
          this.setWrapperDimensions();
          this.slider = document.createElement("div");
          this.slider.className = "jx-slider";
          this.wrapper.appendChild(this.slider);
          if (this.options.mode != "horizontal") {
            addClass(this.slider, this.options.mode);
          }
          this.handle = document.createElement("div");
          this.handle.className = "jx-handle";
          this.rightImage = document.createElement("div");
          this.rightImage.className = "jx-image jx-right";
          this.rightImage.appendChild(this.imgAfter.image);
          this.leftImage = document.createElement("div");
          this.leftImage.className = "jx-image jx-left";
          this.leftImage.appendChild(this.imgBefore.image);
          this.labCredit = document.createElement("a");
          this.labCredit.setAttribute("href", "http://juxtapose.knightlab.com");
          this.labCredit.setAttribute("target", "_blank");
          this.labCredit.className = "jx-knightlab";
          this.labLogo = document.createElement("div");
          this.labLogo.className = "knightlab-logo";
          this.labCredit.appendChild(this.labLogo);
          this.projectName = document.createElement("span");
          this.projectName.className = "juxtapose-name";
          setText(this.projectName, "JuxtaposeJS");
          this.labCredit.appendChild(this.projectName);
          this.slider.appendChild(this.handle);
          this.slider.appendChild(this.leftImage);
          this.slider.appendChild(this.rightImage);
          this.slider.appendChild(this.labCredit);
          this.leftArrow = document.createElement("div");
          this.rightArrow = document.createElement("div");
          this.control = document.createElement("div");
          this.controller = document.createElement("div");
          this.leftArrow.className = "jx-arrow jx-left";
          this.rightArrow.className = "jx-arrow jx-right";
          this.control.className = "jx-control";
          this.controller.className = "jx-controller";
          this.controller.setAttribute("tabindex", 0);
          this.controller.setAttribute("role", "slider");
          this.controller.setAttribute("aria-valuenow", 50);
          this.controller.setAttribute("aria-valuemin", 0);
          this.controller.setAttribute("aria-valuemax", 100);
          this.handle.appendChild(this.leftArrow);
          this.handle.appendChild(this.control);
          this.handle.appendChild(this.rightArrow);
          this.control.appendChild(this.controller);
          this._init();
        }
      },
      _init: function () {
        if (this.checkImages() === false) {
          console.warn(
            this,
            "Check that the two images have the same aspect ratio for the slider to work correctly."
          );
        }
        this.updateSlider(this.options.startingPosition, false);
        if (this.options.showLabels === true) {
          if (this.imgBefore.label) {
            this.displayLabel(this.leftImage, this.imgBefore.label);
          }
          if (this.imgAfter.label) {
            this.displayLabel(this.rightImage, this.imgAfter.label);
          }
        }
        if (this.options.showCredits === true) {
          this.displayCredits();
        }
        var self = this;
        window.addEventListener("resize", function () {
          self.setWrapperDimensions();
        });
        this.slider.addEventListener("mousedown", function (e) {
          e = e || window.event;
          e.preventDefault();
          self.updateSlider(e, true);
          animate = true;
          this.addEventListener("mousemove", function (e) {
            e = e || window.event;
            e.preventDefault();
            if (animate) {
              self.updateSlider(e, false);
            }
          });
          this.addEventListener("mouseup", function (e) {
            e = e || window.event;
            e.preventDefault();
            e.stopPropagation();
            this.removeEventListener("mouseup", arguments.callee);
            animate = false;
          });
        });
        this.slider.addEventListener("touchstart", function (e) {
          e = e || window.event;
          e.preventDefault();
          e.stopPropagation();
          self.updateSlider(e, true);
          this.addEventListener("touchmove", function (e) {
            e = e || window.event;
            e.preventDefault();
            e.stopPropagation();
            self.updateSlider(event, false);
          });
        });
        this.handle.addEventListener("keydown", function (e) {
          e = e || window.event;
          var key = e.which || e.keyCode;
          var ariaValue = parseFloat(this.style.left);
          if (key == 37) {
            ariaValue = ariaValue - 1;
            var leftStart = parseFloat(this.style.left) - 1;
            self.updateSlider(leftStart, false);
            self.controller.setAttribute("aria-valuenow", ariaValue);
          }
          if (key == 39) {
            ariaValue = ariaValue + 1;
            var rightStart = parseFloat(this.style.left) + 1;
            self.updateSlider(rightStart, false);
            self.controller.setAttribute("aria-valuenow", ariaValue);
          }
        });
        this.leftImage.addEventListener("keydown", function (event) {
          var key = event.which || event.keyCode;
          if (key == 13 || key == 32) {
            self.updateSlider("90%", true);
            self.controller.setAttribute("aria-valuenow", 90);
          }
        });
        this.rightImage.addEventListener("keydown", function (event) {
          var key = event.which || event.keyCode;
          if (key == 13 || key == 32) {
            self.updateSlider("10%", true);
            self.controller.setAttribute("aria-valuenow", 10);
          }
        });
        juxtapose.sliders.push(this);
        if (this.options.callback && typeof this.options.callback == "function") {
          this.options.callback(this);
        }
      }
    };
    juxtapose.makeSlider = function (element, idx) {
      if (typeof idx == "undefined") {
        idx = juxtapose.sliders.length;
      }
      var w = element;
      var images = w.querySelectorAll("img");
      var options = {};
      if (w.getAttribute("data-animate")) {
        options.animate = w.getAttribute("data-animate");
      }
      if (w.getAttribute("data-showlabels")) {
        options.showLabels = w.getAttribute("data-showlabels");
      }
      if (w.getAttribute("data-showcredits")) {
        options.showCredits = w.getAttribute("data-showcredits");
      }
      if (w.getAttribute("data-startingposition")) {
        options.startingPosition = w.getAttribute("data-startingposition");
      }
      if (w.getAttribute("data-mode")) {
        options.mode = w.getAttribute("data-mode");
      }
      if (w.getAttribute("data-makeresponsive")) {
        options.mode = w.getAttribute("data-makeresponsive");
      }
      specificClass = "juxtapose-" + idx;
      addClass(element, specificClass);
      selector = "." + specificClass;
      if (w.innerHTML) {
        w.innerHTML = "";
      } else {
        w.innerText = "";
      }
      slider = new juxtapose.JXSlider(
        selector,
        [
          {
            src: images[0].src,
            label: images[0].getAttribute("data-label"),
            credit: images[0].getAttribute("data-credit"),
            alt: images[0].alt
          },
          {
            src: images[1].src,
            label: images[1].getAttribute("data-label"),
            credit: images[1].getAttribute("data-credit"),
            alt: images[1].alt
          }
        ],
        options
      );
    };
    juxtapose.scanPage = function () {
      var elements = document.querySelectorAll(".juxtapose");
      for (var i = 0; i < elements.length; i++) {
        juxtapose.makeSlider(elements[i], i);
      }
    };
    juxtapose.JXSlider = JXSlider;
    window.juxtapose = juxtapose;
    juxtapose.scanPage();
  })(document, window);
  !window.addEventListener &&
    (function (
      WindowPrototype,
      DocumentPrototype,
      ElementPrototype,
      addEventListener,
      removeEventListener,
      dispatchEvent,
      registry
    ) {
      WindowPrototype[addEventListener] = DocumentPrototype[
        addEventListener
      ] = ElementPrototype[addEventListener] = function (type, listener) {
        var target = this;
        registry.unshift([
          target,
          type,
          listener,
          function (event) {
            event.currentTarget = target;
            event.preventDefault = function () {
              event.returnValue = false;
            };
            event.stopPropagation = function () {
              event.cancelBubble = true;
            };
            event.target = event.srcElement || target;
            listener.call(target, event);
          }
        ]);
        this.attachEvent("on" + type, registry[0][3]);
      };
      WindowPrototype[removeEventListener] = DocumentPrototype[
        removeEventListener
      ] = ElementPrototype[removeEventListener] = function (type, listener) {
        for (var index = 0, register; (register = registry[index]); ++index) {
          if (
            register[0] == this &&
            register[1] == type &&
            register[2] == listener
          ) {
            return this.detachEvent("on" + type, registry.splice(index, 1)[0][3]);
          }
        }
      };
      WindowPrototype[dispatchEvent] = DocumentPrototype[
        dispatchEvent
      ] = ElementPrototype[dispatchEvent] = function (eventObject) {
        return this.fireEvent("on" + eventObject.type, eventObject);
      };
    })(
      Window.prototype,
      HTMLDocument.prototype,
      Element.prototype,
      "addEventListener",
      "removeEventListener",
      "dispatchEvent",
      []
    );

//calc
document.addEventListener("DOMContentLoaded", function() {
    var slider1 = document.getElementById("slider-autoinvoice-invoices");
    var slider2 = document.getElementById("slider-autoinvoice-digital");
    var slider3 = document.getElementById("slider-autoinvoice-extra");
    var savingRate = 63.55;
    var $result = document.getElementById("slider-result");

    // Форматирование вывода
    var outputFormat = wNumb({
      prefix: "Ціна набору: грн ",
      decimals: 2,
      thousand: " ",
      mark: ","
    });

    // Создание ползунка для количества відсоток перекису
    noUiSlider.create(slider1, {
      start: 35,
      step: 1,
      tooltips: wNumb({
        decimals: 0,
        thousand: " "
      }),
      range: {
        min: 35,
        max: 60
      },
      connect: "lower"
    });

    // Создание ползунка для води в кубах\тоннах
    noUiSlider.create(slider2, {
      start: 1,
      step: 1,
      tooltips: wNumb({
        decimals: 0
      }),
      range: {
        min: 1,
        max: 50
      },
      connect: "lower"
    });

    // Создание ползунка для Кількість чисток
    noUiSlider.create(slider3, {
      start: 1,
      step: 1,
      tooltips: wNumb({
        decimals: 0
      }),
      range: {
        min: 1,
        max: 10
      },
      connect: "lower"
    });

    function calculateSavings(invoices, digital, extra) {
      digital = digital / 100;
      var result = invoices * (1 - digital) * savingRate * (extra / 100);
      $result.innerHTML = outputFormat.to(result);
    }

    // Установка начальных значений
    var invoiceCount = Number(slider1.noUiSlider.get());
    var digitalCount = Number(slider2.noUiSlider.get());
    var extraCount = Number(slider3.noUiSlider.get());

    calculateSavings(invoiceCount, digitalCount, extraCount);

    // Обновление результатов при изменении значений ползунков
    slider1.noUiSlider.on("update", function(values, handle) {
      invoiceCount = Number(values[handle]);
      calculateSavings(invoiceCount, digitalCount, extraCount);
    });

    slider2.noUiSlider.on("update", function(values, handle) {
      digitalCount = Number(values[handle]);
      calculateSavings(invoiceCount, digitalCount, extraCount);
    });

    slider3.noUiSlider.on("update", function(values, handle) {
      extraCount = Number(values[handle]);
      calculateSavings(invoiceCount, digitalCount, extraCount);
    });
  });
//review
const swiper = new Swiper(".swiper", {
	// Optional parameters
	direction: "horizontal",
	loop: true,
	autoHeight: false,
	centeredSlides:true,
	slidesPerView: 3,
  infinite: false,
  // Responsive breakpoints
  breakpoints: {
    320: {
      slidesPerView: 1,
			  spaceBetween: 40,
    },
    425: {
      slidesPerView: 1,
			  spaceBetween: 40,
    },
		640: {
      slidesPerView: 2,
			  spaceBetween: 40,
    },
    992: {
      slidesPerView: 3,
			  spaceBetween: 40,
    }
  },

	// If we need pagination
	pagination: {
		el: ".swiper-pagination"
	},

	// Navigation arrows
	navigation: {
		nextEl: ".swiper-button-next",
		prevEl: ".swiper-button-prev"
	}
});

//burger//
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const menu = document.querySelector('.menu_laptop');
  const menuClose = document.querySelector('.menu_close');

  hamburger.addEventListener('click', () => {
      menu.classList.toggle('menu_active');
  });

  menuClose.addEventListener('click', () => {
      menu.classList.remove('menu_active');
  });

  // Закрывать меню при клике вне его области
  document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
          menu.classList.remove('menu_active');
      }
  });

  // Отменить закрытие при клике внутри меню
  menu.addEventListener('click', (e) => {
      e.stopPropagation();
  });
});
/* custom select */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.custom-select-wrapper').forEach(function (wrapper) {
      const trigger = wrapper.querySelector('.custom-select-trigger');
      const options = wrapper.querySelector('.custom-options');

      trigger.addEventListener('click', function () {
          options.classList.toggle('show');
      });

      options.querySelectorAll('.custom-option').forEach(function (option) {
          option.addEventListener('click', function () {
              trigger.innerHTML = this.innerHTML;
              options.classList.remove('show');
              wrapper.querySelector('.custom-select').value = this.getAttribute('data-value');
          });
      });

      document.addEventListener('click', function (e) {
          if (!wrapper.contains(e.target)) {
              options.classList.remove('show');
          }
      });
  });
});