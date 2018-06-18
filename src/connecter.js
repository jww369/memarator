import chalk from "chalk";
import apiRequest, { handleResponse } from "./request";
import downloader from "./downloader";
import db from './db';

/**
 * Shrink the data down to only what's necessary: Photo URL's and user names.
 * @param  {Array} Array of gallery photo objects from the API
 * @return {Array} Array of objects containing photo URL and user's name
 */
function mappedMediaObjects(media) {
  return media.map(photo => ({
    url: photo.attachments[0].url,
    user: photo.name ? photo.name : 'UnknownUser'
  }));
}

/**
 * Connect to a given group's gallery and build up an array of downloadable media URL's
 * @param  {String} GroupMe Developer Token ID
 * @param  {Integer} GroupMe Conversation ID
 * @param  {Array} Array of media objects
 * @param  {String} Current page
 * @return {Promise}
 */
export async function mediaListBuilder(token, groupId, media = [], page = "") {
  const path = page
    ? `conversations/${groupId}/gallery?before=${page}&limit=100`
    : `conversations/${groupId}/gallery?limit=100`;

  return await apiRequest(token, path)
    .then(handleResponse)
    .then(({ response: { messages } }) => {
      console.log(chalk.cyan(`Fetching data from: ${chalk.green(path)}`));
      const hasMessages = !!messages.length;

      if (hasMessages) {
        const additionalMedia = media.concat(messages);
        const lastTimeStamp = messages[messages.length - 1].gallery_ts;
        return mediaListBuilder(token, groupId, additionalMedia, lastTimeStamp);
      }

      return mappedMediaObjects(media);
    })
    .catch(error => {
      console.log(error);
    });
}
