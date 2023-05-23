import _ from 'underscore';

export const isBad = (value) => {
    return _.isUndefined(value) || _.isNull(value) || _.isEmpty(value);
}

export const getChannelUrl = (channelName) => {
    // protect against accidentally calling getChannelUrl multiple times....
    if(channelName.includes('https://www.youtube.com/@')) return channelName;
    return `https://www.youtube.com/@${channelName}`;
}

export const isValidURL = (urlString) => {
    let url;
    try {
        url = new URL(urlString);
    } catch (error) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}
