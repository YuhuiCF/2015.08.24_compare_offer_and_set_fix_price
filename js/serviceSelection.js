
var serviceSelection = function(obj){
    var self = this;
    var FG = obj.FG;
    if (typeof FG === 'undefined') {
        return console.error('FairGarage is not defined');
    }
    var model = obj.model;
    if (typeof model === 'undefined') {
        return console.error('model is not defined');
    } else {
        model = $(model);
    }

    var selector = {//selector.select.service = 'li';
        select: {
            service: 'select'
        },
        span: {
            serviceSelected: '.selectionCompleted span'
        }
    };

    //$(selector.input.service, model).val('');
    $(selector.select.service, model).prop('selectedIndex',0);

    var properties = {};

    /**
      * @desc select a service by FairGarage service object
      * @param {object} service, service data
    */
    function selectService(service){
        //$(selector.ul.service, model).empty();
        //$(selector.input.service, model).val('');
        $(selector.span.serviceSelected, model).html(service.name);
        //FG.properties.service = service;
        FG.properties.service = service;
    }
    // bind the function to click event of service results
    $(selector.select.service, model).bind('change',function(){
        //var service = $(this).data('data');
        var service = {
            id: $(this).find('option:eq(' + $(this).prop('selectedIndex') + ')').val(),
            name: $(this).find('option:eq(' + $(this).prop('selectedIndex') + ')').text()
        };
        //selectService(service);
        selectService(service);
    });

};
