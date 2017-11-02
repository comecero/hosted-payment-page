app.controller("PaymentController", ['$scope', '$location', '$routeParams', 'CartService', 'PaymentService', 'SettingsService', 'HelperService', 'GeoService', '$document', function ($scope, $location, $routeParams, CartService, PaymentService, SettingsService, HelperService, GeoService, $document) {
        
        // Define a place to hold your data
        $scope.data = {};
        $scope.options = {};
        
        // Parse the query parameters
        var query = $location.search();
        
        // Define the payment_id
        $scope.data.payment_id = $routeParams.id;
        
        // If no payment_id is supplied, redirect back to the cart.
        if (!$scope.data.payment_id) {
            // Redirect back to the cart
            $location.path("/cart");
        }
        
        // Load in some helpers
        $scope.settings = SettingsService.get();
        $scope.helpers = HelperService;
        $scope.geoService = GeoService;
        
        // Set the cart parameters
        $scope.data.params = {};
        
        // The payment will have a cart or an invoice, we don't know which. Expand both and we'll use whatever one comes back as not null.
        $scope.data.params.expand = "payment_method,payment_method.data,customer";
        
        PaymentService.get($scope.data.payment_id, $scope.data.params).then(function (payment) {

            $scope.data.payment = payment;
            
            if (payment.status == "completed") {
                // The payment was previously completed, redirect to receipt.
                $location.path("/receipt/" + payment.payment_id);
            }

            // Get the payment options
            PaymentService.getOptions().then(function (options) {

                // Set flags to indicate if we need to request the company name and phone number fields, which happens when they're required and not already populated.
                if (HelperService.isRequiredCustomerField('company_name', options) && $scope.data.sale.customer.company_name == null) {
                    $scope.options.showCompanyName = true;
                }

                if (HelperService.isRequiredCustomerField('phone', options) && $scope.data.sale.customer.phone == null) {
                    $scope.options.showPhone = true;
                }

            }, function (error) {
                // Error getting the cart
                $scope.data.error = error;
            });

        }, function (error) {
            $scope.data.error = error;
        });
        
        // Handle a successful payment
        $scope.onPaymentSuccess = function (payment) {

            // If the payment comes back as initiated, it means significant changes to the cart have been done that has changed the payment amount significantly enough that the buyer must re-approve the total through PayPal. Redirect.
            if (payment.status == "initiated") {

                // Redirect to the supplied redirect URL.
                window.location.replace(payment.response_data.redirect_url);

            } else {

                // The payment is completed. Redirect to the receipt.
                $location.path("/receipt/" + payment.payment_id);

            }
        };
        
        // Watch for error to be populated, and if so, scroll to it.
        $scope.$watch("data.error", function (newVal, oldVal) {
            if ($scope.data.error) {
                $document.scrollTop(0, 500);
            }
        });

    }]);
