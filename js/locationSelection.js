
/**
  * @desc vehicleSelection constructor
  * @param {object} pobj
    * @key {object} FG, FairGarage API library
    * @key {object} OF, Offer object
    * @key {string} model, DOM selector, on which the model is used
    * @key {boolean} searchForLocation, if offer for this location should be searched
    * @key {number} locationId, location ID
*/

var locationSelection = function(pobj){
    var FG = pobj.FG;
    if (typeof FG === 'undefined') {
        return console.error('FairGarage is not defined');
    }
    var OF = pobj.OF;
    if (typeof OF === 'undefined') {
        return console.error('offer is not defined');
    }
    var model = pobj.model;
    if (typeof model === 'undefined') {
        return console.error('model is not defined');
    } else {
        model = $(model);
    }
    var searchForLocation = pobj.searchForLocation;
    var signature = pobj.signature;
    var locationId = pobj.locationId;

    var selector = {
        selectionCompleted: '.selectionCompleted',
        locationName: '.locationName',
        mask: '.mask'
    };

    FG.properties.region = {
        //signature: 'b17c390700430aa30a46a55be0b7c054-786e19fdbb19ff2c50e6239528674a9a'
        signature: '45813b51f79b225aee020457ec2e1b99-b85b81a159c28165ae7a26dc96c5bf39'
    };

    function getRegionBySignature(signature){
        FG.getRegionBySignature({
            signature: signature,
            ajax: {
                success: function(data){
                    FG.properties.region = data;
                },
                complete: function(){
                    hideMask();
                }
            }
        });
    }

    function showMask(){
        $(selector.mask, model).show();
    }

    function hideMask(){
        $(selector.mask, model).hide();
    }

    showMask();
    if (searchForLocation) {
        FG.getLocation({
            locationId: locationId,
            ajax: {
                success: function(data){
                    $(selector.locationName, model).html(data.name);
                    OF.setLocation({
                        id: locationId
                    });
                    FG.properties.region = data.locationAddress.region;
                },
                complete: function(){
                    hideMask();
                }
            }
        });
    } else {
        getRegionBySignature(signature);
    }
};
