
/**
  * @desc vehicleSelection constructor
  * @param {object} pobj
    * @key {object} FG, FairGarage API library
    * @key {object} OF, Offer object
    * @key {string} model, DOM selector, on which the model is used
    * @key {boolean} searchForLocation, if offer for this location should be searched
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

    // TODO: make dynamical
    FG.properties.region = {
        //signature: 'b17c390700430aa30a46a55be0b7c054-786e19fdbb19ff2c50e6239528674a9a'
        signature: '45813b51f79b225aee020457ec2e1b99-b85b81a159c28165ae7a26dc96c5bf39'
    };

    FG.getRegionBySignature({
        signature: signature,
        ajax: {
            success: function(data){
                FG.properties.region = data;
            }
        }
    });

    if (searchForLocation === true) {
        OF.setLocation({
            //id: 29
            //id: 74
            id: 419
        });
    }
};
