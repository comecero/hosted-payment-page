module.exports = function (grunt) {

    /*  Load tasks  */
    require('load-grunt-tasks')(grunt);

    /*  Configure project  */
    grunt.initConfig({

        nggettext_extract: {
            pot: {
                files: {
                    '../hosted-payment-page/languages/template/template.po': ['../hosted-payment-page/**/*.html', '../hosted-payment-page/app/**/*.html', '../hosted-payment-page/dist/js/kit.js', '../hosted-payment-page/app/**/*.js', '!../hosted-payment-page/node_modules/**']
                }
            }
        },

        nggettext_compile: {
            all: {
                options: {
                    format: "json"
                },
                files: [
                    {
                        expand: true,
                        dot: true,
                        src: ["../hosted-payment-page/languages/**/*.po", "!../hosted-payment-page/languages/template/*"],
                        ext: ".json"
                    }
                ]
            },
        }

    });

    // Allows to update modified files only.
    grunt.loadNpmTasks('grunt-angular-gettext');

    /*  Register tasks  */
    grunt.registerTask('default', ['nggettext_extract', 'nggettext_compile']);

};