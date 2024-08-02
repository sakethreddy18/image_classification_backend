const {to} = require('await-to-js');
const pe = require('parse-error');

module.exports.to = async (promise) => {
    let err, res;
    [err, res] = await to(promise);
    if(err) return [pe(err)];

    return [null, res];
};

module.exports.ReE = function(res, err, code){ // Error Web Response
    let message = err;
    if(typeof err == 'object' && typeof err.message != 'undefined'){
        message = err.message;
    }

    if(typeof code !== 'undefined') res.statusCode = code;

    send_data = {
        Result: 'Error',
        Data: err,
        Message: message
    };

    return res.json(send_data);
};

module.exports.ReS = function(res, data, code, message){ // Success Web Response
    let send_data = {
        Result:'Success',
        Data: data,
        Message: message
    };

    if(typeof code !== 'undefined') res.statusCode = code;

    return res.json(send_data)
};

module.exports.TE = TE = function(err_message, log){ // TE stands for Throw Error
    if(log === true){
        console.error(err_message);
    }

    throw new Error(err_message);
};