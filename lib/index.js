var request = require("request");

/**
 * Qiwi api
 * @param {string} token Access token
 * @link https://github.com/InsightAppDev/node-qiwi-api
 */
module.exports = function Qiwi(token) {
    /**
     * Allowable recepients
     */
    this.recipients = {
        banks: {
            alfabank: 464,
            tinkoff: 466,
            ao_otp_bank: 804,
            ao_rosselhozbank: 810,
            russkiy_standard: 815,
            pao_vtb: 816,
            promsvyazbank: 821,
            pao_sberbank: 870,
            renessans_credit: 881,
            moskovskiy_kreditniy_bank: 1134
        },
        cards: {
            visa_sng: 1960,
            visa_rus: 1963,
            mastercard_sng: 21012,
            mastercard_rus: 21013,
            mir: 31652,
        },
        differentServices: {
            onlime: 674,
            podari_jizn: 1239
        },
        qiwi: 99,
    }

    /**
     * Access token
     */
    this.token = token;

    /**
     * Headers
     */
    this.headers = {
        'Accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + this.token
    }

    /**
     * Api url
     */
    this.apiUri = "https://edge.qiwi.com";

    /**
     * Transaction type
     */
    this.txnType = {
        "IN": 0,
        "OUT": 1,
        "ALL": 2
    }

    /**
     * Format of receipt file
     */
    this.receiptFormat = {
        Jpeg: 'JPEG',
        Pdf: 'PDF'
    }

    /**
     * Get identification data
     * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#ident_data
     * @param {string} wallet wallet number without plus (+) and with prefix, as example: 79991234567
     * @param {function(err,data)} callback 
     */
    this.getIdentificationData = function (wallet, callback) {
        var options = {
            url: `${this.apiUri}/identification/v1/persons/${wallet}/identification`,
            headers: this.headers,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Identify wallet
     * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#ident
     * @param {string} wallet wallet number without plus (+) and with prefix, as example: 79991234567
     * @param {{birthDate:string, firstName:string, middleName:string, lastName:string, passport:string, inn:string, snils:string, oms:string}} requestOptions
     * @param {function(err,data)} callback 
     */
    this.identifyWallet = function (wallet, requestOptions, callback) {
        var options = {
            url: `${this.apiUri}/identification/v1/persons/${wallet}/identification`,
            headers: this.headers,
            body: requestOptions,
            json: true
        };

        request.post(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Get information about current account
     * @link
     * @param {function(err,data)} callback 
     */
    this.getAccountInfo = function (callback) {
        var options = {
            url: `${this.apiUri}/person-profile/v1/profile/current`,
            headers: this.headers,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Get information about account balance
     * @link
     * @param {function(err,data)} callback 
     */
    this.getBalance = function (callback) {
        var options = {
            url: `${this.apiUri}/funding-sources/v1/accounts/current`,
            headers: this.headers,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Get operation history 
     * @link
     * @param {{rows:number, operation:string, sources:string, startDate:Date, endDate:Date, nextTxnDate:Date, nextTxnId:number}} requestOptions 
     * @param {function(err,data)} callback 
     */
    this.getOperationHistory = function (requestOptions, callback) {
        this.getAccountInfo((err, data) => {
            if (err != null) {
                return callback(err, null);
            }

            if (data == null) {
                return callback(new Error("Can not retrieve account info"), null);
            }

            var options = {
                url: `${this.apiUri}/payment-history/v2/persons/${data.authInfo.personId}/payments`,
                headers: this.headers,
                qs: requestOptions,
                json: true
            };

            request.get(options, (error, response) => {
                processRequestCallback(error, response.body, callback);
            });
        });
    }

    /**
     * Get statistics for operations
     * @link
     * @param {{operation:string, sources:string, startDate:Date, endDate:Date}} requestOptions 
     * @param {function(err,data)} callback 
     */
    this.getOperationStatistics = function (requestOptions, callback) {
        this.getAccountInfo((err, data) => {
            if (err != null) {
                callback(err, null);
                return;
            }

            if (data == null) {
                callback(new Error("Can not retrieve account info"), null);
                return;
            }

            var options = {
                url: `${this.apiUri}/payment-history/v2/persons/${data.authInfo.personId}/payments/total`,
                headers: this.headers,
                qs: requestOptions,
                json: true
            };

            request.get(options, (error, response) => {
                processRequestCallback(error, response.body, callback);
            });
        });
    }

    /**
     * Get information about transaction
     * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#txn_info
     * @param {string} transactionId Transaction Id
     * @param {string} type Transaction type. Possible values: null, IN, OUT (type from getOperationHistory)
     * @param {function(err,data)} callback 
     */
    this.getTransactionInfo = function (transactionId, callback) {
        var options = {
            url: `${this.apiUri}/payment-history/v2/transactions/${transactionId}`,
            headers: this.headers,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Get receipt by transaction
     * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#payment_receipt
     * @param {string} transactionId Transaction Id
     * @param {{type:string, format:string}} requestOptions
     * @param {function(err,data)} callback 
     */
    this.getReceipt = function (transactionId, requestOptions, callback) {
        var options = {
            url: `${this.apiUri}/payment-history/v1/transactions/${transactionId}/cheque/file`,
            headers: this.headers,
            qs: requestOptions,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Send to qiwi wallet
     * @link
     * @param {{amount:number, comment:string, account:string}} requestOptions 
     * @param {function(err,data)} callback 
     */
    this.toWallet = function (requestOptions, callback) {
        var options = {
            url: `${this.apiUri}/sinap/terms/99/payments`,
            headers: this.headers,
            body: {
                id: (1000 * Date.now()).toString(),
                sum: {
                    amount: requestOptions.amount,
                    currency: "643"
                },
                source: "account_643",
                paymentMethod: {
                    type: "Account",
                    accountId: "643"
                },
                comment: requestOptions.comment,
                fields: {
                    account: requestOptions.account
                }
            },
            json: true
        };

        request.post(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Send to mobile phone
     * @param {{amount:number, comment:string, account:string}} requestOptions 
     * @param {function(err,data)} callback 
     */
    this.toMobilePhone = function (requestOptions, callback) {
        detectOperator('7' + requestOptions.account, (err, data) => {
            if (err || data.code.value == "2")
                throw new Error('Can\'t detect operator.');
            else {
                var options = {
                    url: `${this.apiUri}/sinap/terms/${data.message}/payments`,
                    headers: this.headers,
                    body: {
                        id: (1000 * Date.now()).toString(),
                        sum: {
                            amount: requestOptions.amount,
                            currency: "643"
                        },
                        source: "account_643",
                        paymentMethod: {
                            type: "Account",
                            accountId: "643"
                        },
                        comment: requestOptions.comment,
                        fields: {
                            account: requestOptions.account
                        }
                    },
                    json: true
                };

                request.post(options, (error, response) => {
                    processRequestCallback(error, response.body, callback);
                });
            }
        });
    }

    /**
     * Send to card
     * @param {{amount:number, comment:string, account:string}} requestOptions 
     * @param {function(err,data)} callback 
     */
    this.toCard = function (requestOptions, callback) {
        this.detectCard(requestOptions.account, (err, data) => {
            if (err || data.code.value == "2") {
                callback(new Error('Wrong card number!', null));
            }
            else {
                var options = {
                    url: `${this.apiUri}/sinap/terms/${data.message}/payments`,
                    headers: this.headers,
                    body: {
                        id: (1000 * Date.now()).toString(),
                        sum: {
                            amount: requestOptions.amount,
                            currency: "643"
                        },
                        source: "account_643",
                        paymentMethod: {
                            type: "Account",
                            accountId: "643"
                        },
                        comment: requestOptions.comment,
                        fields: {
                            account: requestOptions.account
                        }
                    },
                    json: true
                };

                request.post(options, (error, response) => {
                    processRequestCallback(error, response.body, callback);
                });
            }
        });
    }

    /**
     * Send to bank account
     * @param {{ammount:number,account:string,account_type:number,exp_date:number}} requestOptions 
     * @param {number} recipient 
     * @param {function(err,data)} callback 
     */
    this.toBank = function (requestOptions, recipient, callback) {
        var options = {
            url: `${this.apiUri}/sinap/terms/${recipient}/payments`,
            headers: this.headers,
            body: {
                id: (1000 * Date.now()).toString(),
                sum: {
                    amount: requestOptions.amount,
                    currency: "643"
                },
                source: "account_643",
                paymentMethod: {
                    type: "Account",
                    accountId: "643"
                },
                comment: requestOptions.comment,
                fields: {
                    account: requestOptions.account,
                    account_type: requestOptions.account_type,
                    exp_date: requestOptions.exp_date
                }
            },
            json: true
        };

        request.post(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Get information about commission
     * @param {number} recipient receiver identifier, see this.recipients
     * @param {function(err,data)} callback 
     */
    this.checkCommission = function (recipient, callback) {
        var options = {
            url: `${this.apiUri}/sinap/providers/${recipient}/form`,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Check commission rates
     * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#rates
     * @param {number} recipient receiver identifier, see this.recipients
     * @param {{account:string, amount: number}} requestOptions options
     * @param {function(err,data)} callback 
     */
    this.checkOnlineCommission = function (recipient, requestOptions, callback) {
        var options = {
            url: `${this.apiUri}/sinap/providers/${recipient}/onlineCommission`,
            body: {
                account: requestOptions.account,
                paymentMethod: {
                    type: "Account",
                    accountId: "643"
                },
                purchaseTotals: {
                    total: {
                        amount: requestOptions.amount,
                        currency: "643"
                    }
                }
            },
            json: true
        };

        request.post(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }


    /**
     * Detects operator of phone number
     * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#cell
     * @param {string} phone phone number
     * @param {function(err,data)} callback 
     */
    function detectOperator(phone, callback) {
        var options = {
            url: 'https://qiwi.com/mobile/detect.action',
            headers: this.headers,
            qs: {
                phone: phone
            },
            json: true
        };

        request.post(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Detects card type
     * @param {string} cardNumber card number
     * @param {function(err,data)} callback 
     */
    this.detectCard = function (cardNumber, callback) {
        var options = {
            url: 'https://qiwi.com/card/detect.action',
            headers: this.headers,
            qs: {
                cardNumber: cardNumber
            },
            json: true
        };

        request.post(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Get cross rates
     * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#section-1
     * @param {function(err,data)} callback 
     */
    this.getCrossRates = function (callback) {
        var options = {
            url: `${this.apiUri}/sinap/crossRates`,
            headers: this.headers,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }
    /**
     * Add webhook by url 
     * @param {string} url Url address
     * @param {number} txnType type of messages. 0 - "In", 1 - "Out". 2 - "All", see this.txnType
     * @param {function(err,data)} callback 
     */
    this.addWebHook = function (url, txnType, callback) {
        var options = {
            url: `${this.apiUri}/payment-notifier/v1/hooks`,
            headers: this.headers,
            qs: {
                hookType: 1,
                param: url,
                txnType: txnType
            },
            json: true
        };

        request.put(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Remove webhook by UUID
     * @param {string} hookId webhook UUID
     * @param {function(err,data)} callback 
     */
    this.removeWebHook = function (hookId, callback) {
        var options = {
            url: `${this.apiUri}/payment-notifier/v1/hooks/${hookId}`,
            headers: this.headers,
            json: true
        };

        request.delete(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Get webhook secret key by UUID
     * @param {string} hookId webhook UUID
     * @param {function(err,data)} callback 
     */
    this.getWebHookSecret = function (hookId, callback) {
        var options = {
            url: `${this.apiUri}/payment-notifier/v1/hooks/${hookId}/key`,
            headers: this.headers,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Refresh webhook secret key by UUID
     * @param {string} hookId webhook UUID
     * @param {function(err,data)} callback 
     */
    this.requestNewWebHookSecret = function (hookId, callback) {
        var options = {
            url: `${this.apiUri}/payment-notifier/v1/hooks/${hookId}/newkey`,
            headers: this.headers,
            json: true
        };

        request.post(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Get information about active webhook for this wallet(token)
     * @link https://developer.qiwi.com/ru/qiwi-wallet-personal/index.html#hook_active
     * @param {function(err,data)} callback 
     */
    this.getActiveWebHook = function (callback) {
        var options = {
            url: `${this.apiUri}/payment-notifier/v1/hooks/active`,
            headers: this.headers,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Sends test request to active webhook
     * @param {function(err,data)} callback 
     */
    this.testActiveWebHook = function (callback) {
        var options = {
            url: `${this.apiUri}/payment-notifier/v1/hooks/test`,
            headers: this.headers,
            json: true
        };

        request.get(options, (error, response) => {
            processRequestCallback(error, response.body, callback);
        });
    }

    /**
     * Process request callback
     * @param {*} error 
     * @param {*} body 
     * @param {function(err,data)} callback 
     */
    function processRequestCallback(error, body, callback) {
        if (error != null)
            return callback(error, null);

        if (body.errorCode != undefined)
            return callback(body, null);

        return callback(null, body);
    }

}