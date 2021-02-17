const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const PORT = process.env.PORT || 5000;

const app = express();

const nocache = (req, resp, next) => {
	resp.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
	resp.header('Expires', '-1');
	resp.header('Pragma', 'no-cache');
	next();
};

const generateAccessToken = (req, resp) => {
	// set response header
	resp.header('Access-Control-Allow-Origin', '*');
	// get channel name
	const appId = req.query.appId;
	const appCertificate = req.query.appCertificate;
	const channelName = req.query.channelName;

	let errors = checkForErrors(appId, appCertificate, channelName);
	if (errors) {
		return resp.status(500).json({ errors });
	}

	// get uid
	let uid = req.query.uid;
	if (!uid || uid == '') {
		uid = 0;
	}
	// get role
	let role = RtcRole.SUBSCRIBER;
	if (req.query.role == 'publisher') {
		role = RtcRole.PUBLISHER;
	}
	// get the expire time
	let expireTime = req.query.expireTime;
	if (!expireTime || expireTime == '') {
		expireTime = 3600;
	} else {
		expireTime = parseInt(expireTime, 10);
	}
	// calculate privilege expire time
	const currentTime = Math.floor(Date.now() / 1000);
	const privilegeExpireTime = currentTime + expireTime;
	// build the token
	const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpireTime);
	// return the token
	return resp.json({ appId: APP_ID, channelName, token });
};

function checkForErrors(appId, appCertificate, channelName) {
	let errors = [];

	if (!appId) {
		errors.push('missing appId');
	}

	if (!appCertificate) {
		errors.push('missing appCertificate');
	}

	if (!channelName) {
		errors.push('missing channelName');
	}

	if (errors.length) {
		return errors;
	}
}

app.get('/access_token', nocache, generateAccessToken);
app.get('/', (req, res) => res.send('foo'));
app.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});
