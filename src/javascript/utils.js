/**
 * Function that receives a string like 1205 and return object of minutes and seconds
 */
export function parseTimeInput(value) {
  return {
    minutes: parseInt(value.slice(0, 2)),
    seconds: parseInt(value.slice(3, 5))
  };
}

/**
 * Properly formats an object to a string like 00:00
 */
export function formatDisplayTime(time) {
  return zeroPad(time.minutes.toString()) + ':' + zeroPad(time.seconds.toString());
}


/**
 * Sends notification to the desktop
 */
export function sendNotification(body) {
  new Notification('Breakdown Services Desktop Suite', { body });
}

function zeroPad(string) {
  if (typeof string !== 'string') {
    string = '' + string;
  }
  if (typeof string.padStart === 'function') {
    return string.padStart(2, '0');
  } else {
    return ('00' + string).slice(-'00'.length);
  }
}
