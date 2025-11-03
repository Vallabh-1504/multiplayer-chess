const showModal = (title, message) =>{
    const modalElement = document.getElementById('exampleModal');
    const modal = new bootstrap.Modal(modalElement);

    document.querySelector('#exampleModalLabel').textContent = title;
    document.querySelector('.modal-body').textContent = message;

    modal.show();
};

module.exports = showModal;