const getCurrentDate = () => {
  var now = new Date();
  var dd = String(now.getDate()).padStart(2, "0");
  var mm = String(now.getMonth() + 1).padStart(2, "0"); //January is 0!
  var yyyy = now.getFullYear();
  var hours = String(now.getHours());
  var minutes = String(now.getMinutes());
  var date = "" + hours + ":" + minutes + " - " + dd + "/" + mm + "/" + yyyy;
  return date;
};

class time {
  constructor() {
    this.currentDate = getCurrentDate();
  }
  getDate() {
    return this.currentDate;
  }
}
module.exports = time;
