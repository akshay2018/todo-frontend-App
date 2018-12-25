export interface Notification {
    notiId?: string;
    senderId: string;
    profileId: string;
    senderFullName: string;
    type?: string;
    recipientId?: string;
    listName?: string;
    itemName?: string;
}
