'use strict'

import {
    NativeModules,
    DeviceEventEmitter
} from 'react-native';

const googleFit = NativeModules.RNGoogleFit;

class RNGoogleFit {
    constructor() {
]        this.AuthorizeEventSubscribtion = null;
        this.StepChangedEventSubscribtion = null;
        this.StepHistoryChangedEventSubscribtion = null;
    }

    authorizeFit() {
        googleFit.authorize();
    }

    //Will be deprecated in future releases
    getSteps(dayStart,dayEnd) {
        googleFit.getDailySteps(Date.parse(dayStart), Date.parse(dayEnd));
    }

    //Will be deprecated in future releases
    getWeeklySteps(startDate) {
        googleFit.getWeeklySteps(Date.parse(startDate), Date.now());
    }


    /**
     * Get the total steps per day over a specified date range.
     * @param {Object} options getDailyStepCountSamples accepts an options object containing required startDate: ISO8601Timestamp and endDate: ISO8601Timestamp.
     * @callback callback The function will be called with an array of elements.
     */

    getDailyStepCountSamples(options, callback) {
        let startDate = Date.parse(options.startDate);
        let endDate = Date.parse(options.endDate);
        googleFit.getDailyStepCountSamples( startDate,
            endDate,
            (msg) => {
                callback(msg, false);
            },
            (res) => {
                if (res.length>0) {
                    res = res.map((el) => {
                        if (el.value) {
                            el.startDate = new Date(el.startDate).toISOString();
                            el.endDate = new Date(el.endDate).toISOString();
                            return el;
                        }
                    });
                    callback(false, res.filter(day => day != undefined));
                } else {
                    callback("There is no any steps data for this period", false);
                }
            });
    }

    /**
     * Query for weight samples. the options object is used to setup a query to retrieve relevant samples.
     * @param {Object} options  getDailyStepCountSamples accepts an options object containing unit: "pound"/"kg",
     *                          startDate: ISO8601Timestamp and endDate: ISO8601Timestamp.
     * @callback callback The function will be called with an array of elements.
     */

    getWeightSamples(options, callback) {
        let startDate = Date.parse(options.startDate);
        let endDate = Date.parse(options.endDate);
        googleFit.getWeightSamples( startDate,
            endDate,
            (msg) => {
                callback(msg, false);
            },
            (res) => {
                if (res.length>0) {
                    res = res.map((el) => {
                        if (el.value) {
                            if (options.unit == 'pound') {
                                el.value = this.KgToLbs(el.value); //convert back to pounds
                            }
                            el.startDate = new Date(el.startDate).toISOString();
                            el.endDate = new Date(el.endDate).toISOString();
                            return el;
                        }
                    });
                    callback(false, res.filter(day => day != undefined));
                } else {
                    callback("There is no any weight data for this period", false);
                }
            });
    }

    saveWeight(options, callback) {
        if (options.unit == 'pound') {
            options.value = this.lbsAndOzToK({ pounds: options.value, ounces: 0 }); //convert pounds and ounces to kg
        }
        options.date = Date.parse(options.date);
        googleFit.saveWeight( options,
            (msg) => {
                callback(msg,false);
            },
            (res) => {
                callback(false,res);

            });
    }

    deleteWeight(options, callback) {
        if (options.unit == 'pound') {
            options.value = this.lbsAndOzToK({ pounds: options.value, ounces: 0 }); //convert pounds and ounces to kg
        }
        options.date = Date.parse(options.date);
        googleFit.deleteWeight( options,
            (msg) => {
                callback(msg,false);
            },
            (res) => {
                callback(false,res);

            });
    }

    isAvailable(callback) { // true if GoogleFit installed
        googleFit.isAvailable(
            (msg) => {
                callback(msg,false);
            },
            (res) => {
                callback(false,res);
            });
    }

    isEnabled(callback) { // true if permission granted
        googleFit.isEnabled(
            (msg) => {
                callback(msg,false);
            },
            (res) => {
                callback(false,res);
            });
    }

    observeSteps(callback) {
        this.StepChangedEventSubscribtion = DeviceEventEmitter.addListener(
            'StepChangedEvent',
            (steps) => callback(steps)
        );

        googleFit.observeSteps();
    }

    observeHistory(callback) {
        this.StepChangedEventSubscribtion = DeviceEventEmitter.addListener(
            'StepHistoryChangedEvent',
            (steps) => callback(steps)
        );
    }



    onAuthorize(callback) {
        this.AuthorizeEventSubscribtion = DeviceEventEmitter.addListener(
            'AuthorizeEvent',
            (authorized) => callback(authorized)
        );
    }

    /**
     *
     * @param event [StepHistoryChangedEvent|AuthorizeEvent|StepChangedEvent]
     */
    usubscribeListeners(event) {
        if (typeof event !== 'undefined') {
            switch (event) {
                case 'AuthorizeEvent':
                    if (this.AuthorizeEventSubscribtion) {
                        this.AuthorizeEventSubscribtion.remove();
                        this.AuthorizeEventSubscribtion = null;
                    }
                    break;
                case 'StepHistoryChangedEvent':
                    if (this.StepHistoryChangedEventSubscribtion) {
                        this.StepHistoryChangedEventSubscribtion.remove();
                        this.StepHistoryChangedEventSubscribtion = null;
                    }
                    break;
                case 'StepChangedEvent':
                    if (this.StepChangedEventSubscribtion) {
                        this.StepChangedEventSubscribtion.remove();
                        this.StepChangedEventSubscribtion = null;
                    }
                    break;
            }
        } else {
            if (this.StepChangedEventSubscribtion) {
                this.StepChangedEventSubscribtion.remove();
                this.StepChangedEventSubscribtion = null;
            }
            if (this.AuthorizeEventSubscribtion) {
                this.AuthorizeEventSubscribtion.remove();
                this.AuthorizeEventSubscribtion = null;
            }
            if (this.StepHistoryChangedEventSubscribtion) {
                this.StepHistoryChangedEventSubscribtion.remove();
                this.StepHistoryChangedEventSubscribtion = null;
            }
        }
    }

    lbsAndOzToK(imperial) {
        let pounds = imperial.pounds + imperial.ounces / 16;
        return pounds * 0.45359237;
    }

    KgToLbs(metric) {
        return metric * 2.2046;
    }

}

export default new RNGoogleFit();