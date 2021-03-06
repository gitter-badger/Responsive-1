/*
 * Responsive tabs
 */

/*global jQuery*/
/*jshint expr:true*/
(function ($, w, ns) {

    "use strict";

    if (w.RESPONSIVE_TABS) {
        return;
    }

    // General variables.
    var rtl = $.support.rtl,
        eready = "ready" + ns,
        echanged = ["domchanged" + ns, "shown.r.modal"].join(" "),
        eclick = "click",
        ekeydown = "keydown",
        eshow = "show" + ns,
        eshown = "shown" + ns;

    var keys = {
        SPACE: 32,
        LEFT: 37,
        RIGHT: 39
    };

    // Tabs class definition
    var Tabs = function (element) {

        this.$element = $(element);
        this.tabbing = null;

        // Add accessibility features.
        var $tablist = this.$element.children("ul:first").attr("role", "tablist"),
            $triggers = $tablist.children().attr("role", "presentation"),
            $panes = this.$element.children(":not(ul)"),
            id = $.pseudoUnique();

        $triggers.each(function (index) {
            var $this = $(this),
                $tab = $this.children("a");

            $tab.attr({
                "role": "tab",
                "id": "tab-" + id + "-" + index,
                "aria-controls": "pane-" + id + "-" + index,
                "aria-selected": $this.hasClass("tab-active") ? true : false,
                "tabIndex": 0
            });

            $panes.eq(index).attr({
                "role": "tabpanel",
                "id": "pane-" + id + "-" + index,
                "aria-labelledby": "tab-" + id + "-" + index,
                "tabIndex": $this.hasClass("tab-active") ? 0 : -1
            });
        });

        // Bind events.
        $(this.$element).on(eclick, "ul[role=tablist] > li > [role=tab]", $.proxy(this.click, this))
                        .on(ekeydown, "ul[role=tablist] > li > [role=tab]", $.proxy(this.keydown, this));
    };

    Tabs.prototype.show = function (position) {

        var $activeItem = this.$element.children("ul").children(".tab-active"),
            $children = $activeItem.parent().children(),
            activePosition = $children.index($activeItem),
            self = this;

        if (position > ($children.length - 1) || position < 0) {

            return false;
        }

        if (activePosition === position) {
            return false;
        }

        // Call the function with the callback
        return this.tab(activePosition, position, function ($item) {

            var complete = function () {
                self.tabbing = false;
                self.$element.trigger($.Event(eshown));
            };

            // Do our callback
            $item.onTransitionEnd(complete);
        });
    };

    Tabs.prototype.tab = function (activePosition, postion, callback) {

        var showEvent = $.Event(eshow),
           $element = this.$element,
           $childTabs = $element.children("ul").children("li"),
           $childPanes = $element.children(":not(ul)"),
           $nextTab = $childTabs.eq(postion),
           $currentPane = $childPanes.eq(activePosition),
           $nextPane = $childPanes.eq(postion);

        $element.trigger(showEvent);

        if (this.tabbing || showEvent.isDefaultPrevented()) {
            return;
        }

        this.tabbing = true;

        $childTabs.removeClass("tab-active").children("a").attr({ "aria-selected": false });
        $nextTab.addClass("tab-active").children("a").attr({ "aria-selected": true }).focus();

        // Do some class shuffling to allow the transition.
        $currentPane.addClass("fade-out fade-in");
        $nextPane.attr({ "tabIndex": 0 }).addClass("tab-pane-active fade-out");
        $childPanes.filter(".fade-in").attr({ "tabIndex": -1 }).removeClass("tab-pane-active fade-in");

        // Force redraw.
        $nextPane.redraw().addClass("fade-in");

        // Do the callback
        callback.call(this, $nextPane);
    };

    Tabs.prototype.click = function (event) {

        event.preventDefault();
        event.stopPropagation();

        var $this = $(event.target),
            $li = $this.parent(),
            index = $li.index();

        this.show(index);
    };

    Tabs.prototype.keydown = function (event) {

        var which = event.which;
        // Ignore anything but left and right.
        if (which === keys.SPACE || which === keys.LEFT || which === keys.RIGHT) {

            event.preventDefault();
            event.stopPropagation();

            var $this = $(event.target),
                $li = $this.parent(),
                $all = $li.siblings().addBack(),
                length = $all.length,
                index = $li.index();

            if (which === keys.SPACE) {
                this.show(index);
                return;
            }

            // Select the correct index.
            index = which === keys.LEFT ? (rtl ? index + 1 : index - 1) : (rtl ? index - 1 : index + 1);

            // Ensure that the index stays within bounds.
            if (index === length) {
                index = 0;
            }

            if (index < 0) {
                index = length - 1;
            }

            this.show(index);
        }
    };

    // Plug-in definition 
    $.fn.tabs = function (options) {

        return this.each(function () {

            var $this = $(this),
                data = $this.data("r.tabs");

            if (!data) {
                // Check the data and reassign if not present.
                $this.data("r.tabs", (data = new Tabs(this)));
            }

            // Show the given number.
            if (typeof options === "number") {
                data.show(options);
            }
        });
    };

    // Set the public constructor.
    $.fn.tabs.Constructor = Tabs;

    // No conflict.
    var old = $.fn.tabs;
    $.fn.tabs.noConflict = function () {
        $.fn.tabs = old;
        return this;
    };

    // Data API
    var init = function () {
        $("[data-tabs]").each(function () {
            var $this = $(this),
                loaded = $this.data("r.tabsLoaded");
            if (!loaded) {
                $this.data("r.tabsLoaded", true);
                $this.tabs();
            }
        });
    },
    debouncedInit = $.debounce(init, 500);

    $(document).on([eready, echanged].join(" "), function (event) {
        event.type === "ready" ? init() : debouncedInit();
    });

    w.RESPONSIVE_TABS = true;

}(jQuery, window, ".r.tabs"));
