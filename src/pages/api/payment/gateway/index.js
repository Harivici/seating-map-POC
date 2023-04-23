const VIVENU_URL = "https://vivenu.dev";
const API_KEY = "key_eb4188bd1b920bae03ea8deab794e2d99293be9d715ff2bfef08ca2b8be489041d40ccb367db52139a89575c4c94163e";
const GATEWAY_SECRET = "pm_secret_99548d46bd3b8f48e40d393de2446cb78f74d23ddc96d2645b085c4df51a6051db7bc46dc96d720a1ef811a164b988fc";

const getPaymentRequest = async (paymentId) => {
    const response = await fetch(VIVENU_URL + "/api/payments/requests/" + paymentId, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + API_KEY
        },
    });
    const json = await response.json();
    return json;
};
const completePaymentRequest = async (paymentId) => {
    const response = await fetch(VIVENU_URL + "/api/payments/requests/" + paymentId + "/confirm", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + API_KEY
        },
        body: JSON.stringify({
            gatewaySecret: GATEWAY_SECRET,
            reference: 'test test',
        })
    });
    const json = await response.json();
    return json;
};

export default async (req, res) => {
    const paymentId = req.query.paymentId;
    const paymentRequest = await getPaymentRequest(paymentId);
    console.log(paymentRequest);
    if (paymentRequest.status !== "NEW") {
        console.error("payment request is already processed");
        return res.status(403).end();
    }
    const completedPaymentRequest = await completePaymentRequest(paymentId);
		console.log('completedPaymentRequest', completedPaymentRequest)
		res.json(completedPaymentRequest)
    res.redirect(completedPaymentRequest.successReturnUrl);
    res.end();
};