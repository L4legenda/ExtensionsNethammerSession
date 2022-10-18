export const formatDate = (string: string) => {
    let [date, time] = string.split("T");
    let [year, month, day] = date.split("-");
    let [hour, minute, second] = time.split(":");
    second = second.replace("Z", "");

    return `${month}-${day} ${hour}:${minute}`;
};