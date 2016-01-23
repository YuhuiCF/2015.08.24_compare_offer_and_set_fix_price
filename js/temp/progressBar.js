
var selector = selector || {};

selector.model = selector.model || {};
selector.model.progressBar = '#progressBar';

var progressBar = function(obj){
    var model = obj.model;
    if (typeof model === 'undefined') {
        return console.error('model is not defined');
    } else {
        model = $(model);
    }

    var self = {};
    var properties = {
        progresses: {}
    };

    var selector = {
        span: {
            progressBar: 'span'
        }
    };

    var progress = function(obj){
        var self = {
            linearIncrement: false
        };
        var weight = (typeof obj.weight !== 'undefined' && obj.weight >= 10) ? obj.weight : 10;
        self.maxScore = weight;
        var currentProgress = 0;
        var initStepSize = (typeof obj.initStepSize !== 'undefined' && obj.initStepSize <= weight/10) ? obj.initStepSize : 1;
        var numberOfChanges = 0;
        var score = 0;

        /** 
          * @desc increment the current progress
        */
        self.increment = function(){
            var factor = Math.pow(2,numberOfChanges);
            if (currentProgress + weight/factor >= weight) {
                numberOfChanges++;
                factor = Math.pow(2,numberOfChanges);
            }
            score ++;
            if (self.linearIncrement === true) {
                currentProgress = Math.max(currentProgress,score/self.maxScore*weight);
            } else {
                currentProgress += 2*initStepSize/factor;
            }
        };

        /** 
          * @desc complete the current progress
        */
        self.complete = function(){
            currentProgress = weight;
        };

        /** 
          * @desc get weight of the progress
        */
        self.getWeight = function(){
            return weight;
        };

        /** 
          * @desc increment the progress linearly for max score
          * @param {number} maxScore
        */
        self.incrementLinearly = function(maxScore){
            self.maxScore = maxScore;
            self.linearIncrement = true;
        };

        /** 
          * @desc get current value of the progress
        */
        self.getCurrentProgress = function(){
            return currentProgress;
        };

        return self;
    };

    /** 
      * @desc reset bar
    */
    self.reset = function(){
        properties = {
            progresses: {}
        };
        $(selector.span.progressBar, model).html(0);
    };

    /** 
      * @desc create progress of the progress bar
      * @param {object} obj, 
    */
    self.createNewProgress = function(obj){
        var name = obj.name;
        var weight = obj.weight;
        var initStepSize = obj.initStepSize;
        properties.progresses[name] = new progress({
            weight: weight,
            initStepSize: initStepSize
        });
    };

    /** 
      * @desc get progress of the progress bar with the progress name
      * @param {string} name, name of the progress
    */
    self.getProgress = function(name){
        return properties.progresses[name];
    };

    /** 
      * @desc update total progress
    */
    self.getPercentage = function(){
        var totalProgress = 1;
        var currentProgress = 1;
        for (var key in properties.progresses) {
            totalProgress += properties.progresses[key].getWeight();
            currentProgress += properties.progresses[key].getCurrentProgress();
        }
        return Math.min((Number(100*currentProgress/totalProgress)).toFixed(0), 99);
    };

    /** 
      * @desc show progress bar
    */
    self.showProgressBar = function(){
        model.show();
        $(selector.span.progressBar, model).html(0);
    };

    /** 
      * @desc hide progress bar
    */
    self.hideProgressBar = function(){
        model.hide();
    };

    /** 
      * @desc hide progress bar
      * @param {string} name, name of the progress
    */
    self.increment = function(name){
        if (typeof self.getProgress(name) !== 'undefined') {
            self.getProgress(name).increment();
            self.updateProgressBar();
        }
    };

    /** 
      * @desc hide progress bar
      * @param {string} name, name of the progress
    */
    self.complete = function(name){
        if (typeof self.getProgress(name) !== 'undefined') {
            self.getProgress(name).complete();
            self.updateProgressBar();
        }
    };

    /** 
      * @desc hide progress bar
    */
    self.updateProgressBar = function(){
        self.showProgressBar();
        $(selector.span.progressBar, model).html(self.getPercentage);
    };

    return self;
};

PB = progressBar({
    model: selector.model.progressBar
});
