declare module "dojot-module" {

/**
 * Creating a new type ChannelId so that the user knows what should be passed
 * to messaging functions.
 */
type ChannelId = string;

/**
 * A simple redefinition for a event callback function
 */
type EventCallback<T> = (data: T) => void;

/**
 * Event type enumeration
 */
type EventType = "device-data" | "tenant"

class Message {
  public tenant: string;

  constructor(t: string) {
    this.tenant = t;
  };
};

class DeviceCreation extends Message {
  public deviceid: string;
  constructor() {

  }
};


/**
 * Open a communication channel to send and receive messages
 * from dojot.
 *
 * A communication channel is a messaging structured to be used for message
 * exchanging using a particular subject.
 * @param {string} subject The subject used to send or receive messages.
 * @param {string} mode "r" for reading messages only, "w" for writing messages
 * and "rw" for both.
 * @returns {string} A communication ID. This should be used whenever this
 * channel must be used.
 */
function openChannel(subject: string, mode: "r" | "w" | "rw") : ChannelId;

/**
 * Close a communication channel.
 *
 * Any pending message will be sent and no more messages will be exchanged
 * through it.
 * @param {string} channelId The communication channel to be closed
 */
function closeChanne(channelId: ChannelId) : void;

/**
 *
 * @param event
 * @param channelId
 * @param callback
 */
function on<T extends Message>(event: EventType, channelId: ChannelId, callback: EventCallback<T>);

/**
 *
 * @param channelId
 * @param message
 */
function send<T extends Message>(channelId: ChannelId, message: T);


/////
// IoT agent related
/////

function init();
function updateAttrs();
}
