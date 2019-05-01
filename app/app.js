var app = angular.module("checkout", ['ngRoute', 'ngSanitize', 'ui.bootstrap', 'angular-loading-bar', 'gettext', 'duScroll', 'tmh.dynamicLocale']);

app.config(['$httpProvider', '$routeProvider', '$locationProvider', '$provide', 'cfpLoadingBarProvider', 'tmhDynamicLocaleProvider', function ($httpProvider, $routeProvider, $locationProvider, $provide, cfpLoadingBarProvider, tmhDynamicLocaleProvider) {

    // Define routes
    $routeProvider.when("/link", { templateUrl: "app/pages/link/link.html", reloadOnSearch: false });
    $routeProvider.when("/pay", { templateUrl: "app/pages/pay/pay.html", reloadOnSearch: false });
    $routeProvider.when("/review/:id", { templateUrl: "app/pages/review/review.html" });
    $routeProvider.when("/receipt/:id", { templateUrl: "app/pages/receipt/receipt.html" });

    // Handle root conditionally based on settings
    if (window.__settings.app.enable_help_redirect) {
        $routeProvider.when("/", {
            redirectTo: function () {
                window.location.replace("getting-started/#/docs");
            }
        });
    } else {
        $routeProvider.when("/", { redirectTo: "/link" });
    }

    // Non-handled routes.
    var notFoundUrl = window.__settings.app.not_found_url;

    if (!notFoundUrl) {
        notFoundUrl = window.__settings.app.main_website_url;
    }

    if (!notFoundUrl) {
        // The support URL
        notFoundUrl = window.__settings.account.support_url;
    }

    $routeProvider.otherwise({
        redirectTo: function () {
            window.location.replace(notFoundUrl);
        }
    });

    // Loading bar https://github.com/chieffancypants/angular-loading-bar A global loading bar when HTTP requests are being made so you don't have to manually trigger spinners on each ajax call.
    cfpLoadingBarProvider.latencyThreshold = 300;
    cfpLoadingBarProvider.includeSpinner = false;

    // Dynamically load locale files
    tmhDynamicLocaleProvider.localeLocationPattern("https://cdnjs.cloudflare.com/ajax/libs/angular-i18n/1.5.5/angular-locale_{{locale}}.js");

    // Set the favicon
    var favicon = document.createElement("link");
    favicon.setAttribute("rel", "icon");
    favicon.setAttribute("type", "image/x-icon");

    if (window.__settings.app.favicon_full) {
        favicon.setAttribute("href", window.__settings.app.favicon_full);
    } else {
        favicon.setAttribute("href", "images/default_favicon.png");
    }

    document.head.appendChild(favicon);


}]);

// Bootstrap settings
app.run(['$rootScope', 'SettingsService', 'tmhDynamicLocale', 'StorageService', '$location', function ($rootScope, SettingsService, tmhDynamicLocale, StorageService, $location) {

    // This defines the languages supported by the app. Each supported language must have an associated translation file in the languages folder. It ain't magic.

    var settings = SettingsService.get();

    if (settings.app.enable_languages) {
        $rootScope.languages = [
            {
                code: "en",
                name: "English"
            },
            {
                code: "cs",
                name: "Čeština"
            },
            {
                code: "de",
                name: "Deutsch"
            },
            {
                code: "el",
                name: "Ελληνικά"
            },
            {
                code: "es",
                name: "Español"
            },
            {
                code: "fi",
                name: "Suomalainen"
            },
            {
                code: "fr",
                name: "Français"
            },
            {
                code: "it",
                name: "Italiano"
            },
            {
                code: "ja",
                name: "日本語"
            },
            {
                code: "ko",
                name: "한국어"
            },
            {
                code: "nl",
                name: "Nederlands"
            },
            {
                code: "pl",
                name: "Polskie"
            },
            {
                code: "pt",
                name: "Português"
            },
            {
                code: "ru",
                name: "Русский"
            },
            {
                code: "sv",
                name: "Svenska"
            },
            {
                code: "zh-CN",
                name: "中文"
            }
        ]
    }

    // Analytics. Watch for route changes and load analytics accordingly.
    $rootScope.$on('$locationChangeSuccess', function () {
        if (window.__pageview && window.__pageview.recordPageLoad) {
            window.__pageview.recordPageLoad();
        }
    });

    // If the app is configured to redirect calls to root to the docs, do so here.
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        
    });


}]);

// Custom HTML directive
app.directive('customHtml', ['SettingsService', function (SettingsService) {

    return {
        restrict: 'AE',
        link: function (scope, elem, attrs, ctrl) {

            var settings = SettingsService.get();

            // Set the element's contents as the custom header html, if supplied

            if (attrs.section == "header" && settings.app != null) {
                var customHtml = settings.app.header_html;
                if (customHtml) {
                    elem.html(customHtml);
                }
            }

            if (attrs.section == "footer" && settings.app != null) {
                var customHtml = settings.app.footer_html;
                if (customHtml) {
                    elem.html(customHtml);
                }
            }

        }
    }

}]);

// Custom title controller
app.controller("TitleController", ['$scope', 'SettingsService', function ($scope, SettingsService) {

    var settings = SettingsService.get().app;
    $scope.title = settings.page_title || "Make Payment";

}]);


