document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("notify-btn");
  if (btn) {
    btn.addEventListener("click", function () {
      fetch(notifyAjax.ajaxurl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "action=notify_gmail",
      })
        .then((response) => response.text())
        .then((data) => {
          document.getElementById("response").innerText = data;
        });
    });
  }
});
