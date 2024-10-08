document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  document
    .querySelector("#compose-form")
    .addEventListener("submit", send_email);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email(recipients = "", subject = "", body = "") {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#detail-view").style.display = "none";

  // Fill in composition fields
  document.querySelector("#compose-recipients").value = recipients;
  document.querySelector("#compose-subject").value = subject;
  document.querySelector("#compose-body").value = body;
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#detail-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      emails.forEach((singleEmail) => {
        const selectionEmail = document.createElement("div");

        selectionEmail.classList.add("card", "mb-3", "border-primary");
        if (singleEmail.read) {
          selectionEmail.classList.add("bg-light");
        }

        selectionEmail.innerHTML = `
        <div class="card-body" style="position: relative;">
          <h5 class="card-title text-primary">Sender: ${singleEmail.sender}</h5>
          <h6 class="card-subtitle mb-2 text-muted">Subject: ${singleEmail.subject}</h6>
          <p class="card-text text-end" style="position: absolute; top: 0; right: 15px;">${singleEmail.timestamp}</p>
          <i class="bi bi-envelope-open text-success" style="display: none; position: absolute; top: 0; left: 15px;"></i>
        </div>
      `;

        selectionEmail.addEventListener("mouseenter", function () {
          selectionEmail.classList.remove("border-primary");
          selectionEmail.classList.add("border-success");
          selectionEmail.querySelector(".bi-envelope-open").style.display =
            "block";
        });

        selectionEmail.addEventListener("mouseleave", function () {
          selectionEmail.classList.remove("border-success");
          selectionEmail.classList.add("border-primary");
          selectionEmail.querySelector(".bi-envelope-open").style.display =
            "none";
        });

        selectionEmail.addEventListener("click", function () {
          console.log("This element has been clicked!");
          selectionEmail.classList.add("bg-light");
          mark_as_read(singleEmail.id);
          view_email(singleEmail.id);
        });

        document.querySelector("#emails-view").append(selectionEmail);
      });
    });
}

function view_email(id) {
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      document.querySelector("#emails-view").style.display = "none";
      document.querySelector("#compose-view").style.display = "none";
      document.querySelector("#detail-view").style.display = "block";

      document.querySelector("#detail-view").innerHTML = `
        <div class="card">
          <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <strong>Email Details</strong>
            <span class="text-white">${email.timestamp}</span>
          </div>
          <div class="card-body">
            <h5 class="card-title"><strong>From: </strong> ${email.sender}</h5>
            <h6 class="card-subtitle mb-2 text-muted"><strong>To: </strong> ${
              email.recipients
            }</h6>
            <h6 class="card-subtitle mb-2 text-muted"><strong>Subject: </strong> ${
              email.subject
            }</h6>  
            <hr />
            <p class="card-text">${email.body}</p>
          </div>
          <div class="card-footer text-end">
            <button class="btn btn-secondary" onclick="load_mailbox('inbox')">Back to Inbox</button>
            <button class="btn btn-warning" id="archive-btn">${
              email.archived ? "Unarchive" : "Archive"
            }</button>
            <button class="btn btn-primary" id="reply-btn">Reply</button>
          </div>
        </div>
      `;

      // Mark email as read
      if (!email.read) {
        mark_as_read(email.id);
      }

      // Archive or Unarchive button functionality
      document
        .querySelector("#archive-btn")
        .addEventListener("click", function () {
          fetch(`/emails/${email.id}`, {
            method: "PUT",
            body: JSON.stringify({
              archived: !email.archived,
            }),
          }).then(() => load_mailbox("inbox"));
        });

      // Reply button functionality
      document
        .querySelector("#reply-btn")
        .addEventListener("click", function () {
          const recipients = email.sender;
          let subject = email.subject;
          if (!subject.startsWith("Re: ")) {
            subject = "Re: " + subject;
          }
          const body = `On ${email.timestamp}, ${email.sender} wrote:\n${email.body}\n\n`;
          compose_email(recipients, subject, body);
        });
    });
}

function mark_as_read(id) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      read: true,
    }),
  });
}

function send_email(event) {
  event.preventDefault();

  const recipient = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      // Print result
      console.log(result);
      load_mailbox("sent");
    });
}
