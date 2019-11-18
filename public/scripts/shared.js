
// This adds click event for message triangles

const messageIcons = document.querySelectorAll('.message-triangle:not([style])') // This selects all triangles which don't have style attribute, so which are not hidden.
const messages = document.querySelectorAll('.status-message')

for (let i = 0; i < messageIcons.length; i++) {
  messageIcons[i].addEventListener('mouseover', function () {
    messages[i].classList.add('show')
    messageIcons[i].classList.add('show-triangle')
  })
  messageIcons[i].addEventListener('mouseout', function () {
    messages[i].classList.remove('show')
    messageIcons[i].classList.remove('show-triangle')
  })
}

// Delete Button confirmation window

const deleteButton = document.querySelectorAll('.btn-danger')

deleteButton.forEach((button) => {
  button.addEventListener('click', (e) => {
    const buttonText = button.innerText.toLowerCase()

    if (confirm(`Are you sure you want to ${buttonText}?`)) {
      return true
    } else {
      e.preventDefault()
    }
  })
})

// Return Button confirmation window

const returnButton = document.querySelectorAll('.return-button')

returnButton.forEach((button) => {
  button.addEventListener('click', (e) => {
    const buttonText = 'Are you sure you want to mark this product as returned?'

    if (confirm(`${buttonText}`)) {
      return true
    } else {
      e.preventDefault()
    }
  })
})

// User form validation

function validateForm(id) {

  const form = document.getElementById(id)
  const status = form['status'].value
  const email = form['email'].value

  if (status === '' && email === '') {
    alert('Update at least one field')
    return false
  }

}

