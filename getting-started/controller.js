app.controller("DocsController", ['$scope', 'PaymentService', 'SettingsService', function ($scope, PaymentService, SettingsService) {

    $scope.data = {};
    $scope.settings = SettingsService.get();

    // Set the app URL for the snippet example
    var path = window.location.pathname.substring(1);
    path = path.substring(0, path.indexOf("/"));
    $scope.data.src = window.location.protocol + "//" + window.location.hostname + "/" + path;

    $scope.data.test = false;

    // Get the payment options
    PaymentService.getOptions().then(function (options) {
        $scope.data.options = options;
    });

}]);

app.controller("LinkBuilderController", ['$scope', 'PaymentService', 'SettingsService', '$httpParamSerializer', function ($scope, PaymentService, SettingsService, $httpParamSerializer) {

    $scope.data = {};
    $scope.link = {};
    $scope.meta = [];
    $scope.functions = {};
    $scope.options = { amount: "none" };
    $scope.settings = SettingsService.get();

    // Set the app URL for the snippet example
    var path = window.location.pathname.substring(1);
    path = path.substring(0, path.indexOf("/"));
    $scope.data.src = window.location.protocol + "//" + window.location.hostname + "/" + path;

    $scope.data.test = false;

    // Get the payment options
    PaymentService.getOptions().then(function (options) {
        $scope.data.options = options;
        $scope.link.currency = options.customer_default_currency;
    });

    $scope.functions.getLink = function () {

        var base = $scope.data.src + "/#/link"
        var params = {};

        // Payment amounts
        if ($scope.options.amount == "not-editable") {
            params.subtotal = $scope.link.subtotal;
            params.shipping = $scope.link.shipping;
            params.tax = $scope.link.tax;
        } else if ($scope.options.amount == "editable") {
            params.total = $scope.link.total;
        }

        params.currency = $scope.link.currency;

        // Payment details
        params.reference = $scope.link.reference ;
        params.description = $scope.link.description;

        // Customer info
        params.name = $scope.link.name;
        params.email = $scope.link.email;
        params.company_name = $scope.link.company_name;

        // Custom data
        for (var i = 0; i < $scope.meta.length; i++) {
            if ($scope.meta[i].value) {
                params[$scope.meta[i].name.trim()] = $scope.meta[i].value.trim();
            }
        }

        // Remove anything that is blank or null
        for (var property in params) {
            if (params.hasOwnProperty(property)) {
                if (!params[property]) {
                    delete params[property];
                }
            }
        }

        // Remove currency if amount == none
        if ($scope.options.amount == "none") {
            delete params.currency;
        }

        var qs = $httpParamSerializer(params);

        if (qs.length) {
            $scope.url = base + "?" + qs;
        } else {
            $scope.url = base;
        }

        // Set up clipboard.js
        var clipboard = new Clipboard('.clipboard');

        clipboard.on('success', function (e) {
            e.clearSelection();
        });

    }

    $scope.functions.reset = function () {
        $scope.link = { currency: $scope.data.options.customer_default_currency };
        $scope.meta = [];
        $scope.url = null;
        $scope.options.amount = "none";
    }

    $scope.functions.removeMeta = function (index) {
        $scope.meta.splice(index, 1);
    }

    // Watch if link or meta changes. If so, reset URL
    $scope.$watch("[link, meta, options.amount]", function (oldVal, newVal) {

        if (newVal !== oldVal && url) {
            $scope.url = null;
        }

    }, true);

}]);