// PubNub Configuration
// Get free keys at: https://dashboard.pubnub.com/signup

const PUBNUB_CONFIG = {
    publishKey: 'demo', // Replace with your PubNub Publish Key
    subscribeKey: 'demo', // Replace with your PubNub Subscribe Key
    userId: `user-${Math.random().toString(36).substr(2, 9)}`
};

export default PUBNUB_CONFIG;
