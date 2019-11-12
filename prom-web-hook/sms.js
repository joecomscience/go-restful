const request = require('request');
const { parseString } = require('xml2js')

const URL = process.env.SMS_URI;

const getData = (info) => {
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://services.ge.com" xmlns:bean="http://bean.ge.com">
        <soapenv:Header/>
        <soapenv:Body>
        <ser:saveSMS>
            <ser:bean>
                <bean:accountNo></bean:accountNo>
                <bean:appowner>DIGITAL_TECH</bean:appowner>
                <bean:busMsgCode>IT</bean:busMsgCode>
                <bean:cardNo></bean:cardNo>
                <bean:channel>INFO</bean:channel>
                <bean:lang>THA</bean:lang>
                <bean:msg>${info.msg}</bean:msg>
                <bean:profile>KRUNGSRIGRP_EN</bean:profile>
                <bean:refMsgCode></bean:refMsgCode>
                <bean:scheduling></bean:scheduling>
                <bean:subApp>OPENSHIFT</bean:subApp>
                <bean:telNo>${info.telNo}</bean:telNo>
            </ser:bean>
        </ser:saveSMS>
        </soapenv:Body>
    </soapenv:Envelope>`;
}

const sendMsgToSmsGateway = ({ message, sendTo }) => {
    console.info(`sending message: "${message}" to: ${sendTo}`);
    return new Promise((resolve, reject) => {
        const body = getData({ message, sendTo });
        const options = {
            url: URL,
            method: 'POST',
            body,
            headers: {
                'Content-Type': 'text/xml;charset=utf-8',
                'Content-Length': body.length,
                'SOAPAction': 'saveSMS'
            }
        };

        request(options, (err, res, body) => {
            if (err) {
                console.error(err);
                return reject(err);
            };
            const parseXMLToString = (err, result) => {
                if (err) {
                    console.error(err);
                    return reject(err);
                };
                return resolve(result)
            };
            parseString(body, parseXMLToString)
        });
    });
}

const getPhoneNumber = () => ['0883105138'];

const getAlertsMessage = ({ alerts }) => {
    const msg = [];
    for (const item of alerts) {
        const message = item.annotations.description;
        msg.push(message);
    };
    return msg;
}

const getAlertInfomation = (phones, messages) => {
    const info = {};
    for (const msg of messages) {
        for (const phone of phones) {
            info[msg] = phone;
        };
    };
    return info;
}

const startSendingSMS = (information) => {
    const requests = [];
    for (const key in information) {
        const message = key;
        const sendTo = information[key];
        requests.push(sendMsgToSmsGateway({ message, sendTo }));
    }

    return Promise.all(requests);
}

const sendSms = async (req, res) => {
    const phones = getPhoneNumber();
    const alertMessages = getAlertsMessage(req.body);
    const information = getAlertInfomation(phones, alertMessages);

    try {
        await startSendingSMS(information);
    } catch (error) {
        console.error(error);
    }
    return res.sendStatus(200)
};

module.exports = {
    sendSms,
};