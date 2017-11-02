var app = angular.module("checkout", ['ngRoute', 'ngSanitize', 'ui.bootstrap', 'angular-loading-bar', 'gettext', 'duScroll']);

app.config(['$httpProvider', '$routeProvider', '$locationProvider', '$provide', 'cfpLoadingBarProvider', function ($httpProvider, $routeProvider, $locationProvider, $provide, cfpLoadingBarProvider) {

    // Define routes
    $routeProvider.when("/pay", { templateUrl: "app/pages/pay/pay.html", reloadOnSearch: false });
    $routeProvider.when("/review/:id", { templateUrl: "app/pages/review/review.html" });
    $routeProvider.when("/receipt/:id", { templateUrl: "app/pages/receipt/receipt.html" });

    // Non-handled routes.
    var notFoundUrl = window.__settings.app.not_found_url;

    if (notFoundUrl == null) {
        notFoundUrl = window.__settings.app.main_website_url;
    }

    if (notFoundUrl == null) {
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

    // Set the favicon
    if (window.__settings.app.favicon_full) {
        var favicon = document.createElement("link");
        favicon.setAttribute("rel", "icon");
        favicon.setAttribute("type", "image/x-icon");
        favicon.setAttribute("href", window.__settings.app.favicon_full);
        document.head.appendChild(favicon);
    }

}]);

// Bootstrap settings
app.run(['$rootScope', 'SettingsService', function ($rootScope, SettingsService) {

    // This defines the languages supported by the app. Each supported language must have an associated translation file in the languages folder. It ain't magic.

    var settings = SettingsService.get();

    if (settings.app.enable_languages) {
        $rootScope.languages = [
            {
                code: "en",
                name: "English"
            },
            {
                code: "fr",
                name: "français"
            },
            {
                code: "es",
                name: "Español"
            },
            {
                code: "ru",
                name: "русский"
            }
        ]
    }

    // Analytics. Watch for route changes and load analytics accordingly.
    $rootScope.$on('$locationChangeSuccess', function () {
        if (window.__pageview && window.__pageview.recordPageLoad) {
            window.__pageview.recordPageLoad();
        }
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
    $scope.title = settings.page_title || "Checkout";

}]);

