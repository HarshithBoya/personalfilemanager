window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("uploadBtn").addEventListener("click", uploadFile);
    document.getElementById("viewAllBtn").addEventListener("click", toggleAllFiles);
    document.getElementById("searchBox").addEventListener("input", filterFiles);
    loadLatestFiles();
    loadFolders();
});

async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    const folder = document.getElementById('folderSelect').value;

    if (!file) {
        alert('Please select a file.');
        return;
    }

    console.log("Uploaded file type:", file.type);

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/html',
        'application/javascript',
        'text/x-python',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
        alert("Only PDF, DOC, or DOCX files are allowed.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    const result = await response.text();
    alert(result);

    if (response.ok) {
        loadLatestFiles();
        if (document.getElementById("viewAllList").style.display === "block") {
            showAllFiles();
        }
    }
}

async function loadLatestFiles() {
    const res = await fetch("/latest-files");
    const files = await res.json();
    const list = document.getElementById("latestList");
    list.innerHTML = "";

    files.forEach(file => {
        const li = document.createElement("li");
        const encoded = encodeURIComponent(file);
        li.innerHTML = `<a href="/downloads/${encoded}" target="_blank">${file}</a>`;
        list.appendChild(li);
    });
}

async function toggleAllFiles() {
    const listContainer = document.getElementById("viewAllList");
    listContainer.style.display = listContainer.style.display === "none" ? "block" : "none";

    if (listContainer.style.display === "block") {
        await showAllFiles();
    }
}

async function showAllFiles() {
    try {
        const response = await fetch("/all-files");
        const files = await response.json();
        const listContainer = document.getElementById("viewAllList");
        listContainer.innerHTML = "";

        if (files.length === 0) {
            listContainer.innerHTML = "No files found.";
            return;
        }

        files.forEach(file => {
            const div = document.createElement("div");
            div.classList.add("file-item");
            div.setAttribute("data-filename", file.toLowerCase());

            const link = document.createElement("a");
            const encoded = encodeURIComponent(file);
            link.href = `/downloads/${encoded}`;
            link.target = "_blank";

            if (/\.(png|jpe?g|gif)$/i.test(file)) {
                const img = document.createElement("img");
                img.src = `/downloads/${encoded}`;
                img.alt = file;
                img.style.width = "100px";
                img.style.marginRight = "10px";
                link.appendChild(img);
            } else {
                link.textContent = file;
            }

            const delBtn = document.createElement("button");
            delBtn.textContent = "Delete";
            delBtn.className = "delete-btn";
            delBtn.onclick = () => deleteFile(file);

            div.appendChild(link);
            div.appendChild(delBtn);
            listContainer.appendChild(div);
        });
    } catch (err) {
        document.getElementById("viewAllList").innerHTML = "Failed to load files.";
        console.error("Error fetching files:", err);
    }
}

function filterFiles() {
    const query = document.getElementById("searchBox").value.toLowerCase();
    const fileItems = document.querySelectorAll("#viewAllList .file-item");

    fileItems.forEach(item => {
        const name = item.getAttribute("data-filename");
        item.style.display = name.includes(query) ? "block" : "none";
    });
}

async function deleteFile(fileName) {
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

    try {
        const res = await fetch(`/delete/${fileName}`, { method: 'DELETE' });
        const result = await res.text();
        alert(result);
        showAllFiles();
        loadLatestFiles();
    } catch (err) {
        alert("Failed to delete file.");
        console.error("Error:", err);
    }
}

async function loadFolders() {
    const res = await fetch('/folders');
    const folders = await res.json();
    const folderList = document.getElementById("folderList");
    folderList.innerHTML = "";

    folders.forEach(folder => {
        const li = document.createElement("li");
        li.innerHTML = `<button onclick="showFilesInFolder('${folder}')">${folder}</button>`;
        folderList.appendChild(li);
    });
}

async function showFilesInFolder(folderName) {
    const res = await fetch(`/files/${folderName}`);
    const files = await res.json();

    document.getElementById("currentFolderName").textContent = folderName;
    const fileListDiv = document.getElementById("folderFileList");
    fileListDiv.innerHTML = "";

    files.forEach(file => {
        const div = document.createElement("div");
        div.classList.add("file-item");

        const link = document.createElement("a");
        const encoded = encodeURIComponent(file);
        link.href = `/downloads/${encoded}`;
        link.target = "_blank";

        if (/\.(png|jpe?g|gif)$/i.test(file)) {
            const img = document.createElement("img");
            img.src = `/downloads/${encoded}`;
            img.alt = file;
            img.style.width = "100px";
            link.appendChild(img);
        } else {
            link.textContent = file;
        }

        div.appendChild(link);
        fileListDiv.appendChild(div);
    });

    document.getElementById("folderFilesSection").style.display = "block";
}

function createFolder() {
    const folderName = document.getElementById("folderNameInput").value.trim();

    if (!folderName) {
        alert("Please enter a folder name.");
        return;
    }

    fetch('http://localhost:3000/create-folder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folder: folderName })
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to create folder.");
        return res.text();
    })
    .then(msg => {
        alert(msg);
        document.getElementById("folderNameInput").value = "";
        loadFolders();
    })
    .catch(err => {
        console.error(err);
        alert("Something went wrong while creating the folder.");
    });
}
