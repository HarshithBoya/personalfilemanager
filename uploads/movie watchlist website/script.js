document.addEventListener('DOMContentLoaded', function () {
    const list = document.querySelector('#movie-list ul');
    const addForm = document.forms['add-movie'];

    // Delete movie
    list.addEventListener('click', (e) => {
        if (e.target.className === 'delete') {
            const li = e.target.parentElement;
            li.remove();
        }
    });

    // Add movie
    addForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const inputField = addForm.querySelector('input[type="text"]');
        const value = inputField.value.trim();
        if (value === '') return; // Prevent adding empty movies

        // Create elements
        const li = document.createElement('li');
        const movieName = document.createElement('span');
        const deleteBtn = document.createElement('span');

        // Add text content
        movieName.textContent = value;
        deleteBtn.textContent = 'Delete';

        // Add classes
        movieName.classList.add('name');
        deleteBtn.classList.add('delete');

        // Append to the DOM
        li.appendChild(movieName);
        li.appendChild(deleteBtn);
        list.appendChild(li);

        // Clear input field
        inputField.value = '';
    });
});
