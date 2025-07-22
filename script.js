import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    setDoc,
    getDocs,
    deleteDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendEmailVerification,
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";



const firebaseConfig = {
    apiKey: "AIzaSyDYKI01gvYWj4yPSl1dXQE0E4KM-rk9kQw",
    authDomain: "todo-list-8c955.firebaseapp.com",
    projectId: "todo-list-8c955",
    storageBucket: "todo-list-8c955.firebasestorage.app",
    messagingSenderId: "511990593283",
    appId: "1:511990593283:web:fca085625f41570fd2db36",
    measurementId: "G-VSHMM32YEB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app)

// All elements
let signupForm = document.querySelector('#signup-form');
let loginForm = document.querySelector('#login-form')
let TaskInput = document.querySelector('#task-input');
let SignupFormEmailInput = document.querySelector('#Signup-form-email-input');
let SignupFormPasswordInput = document.querySelector('#signup-form-password-input');
let navSignupBtn = document.querySelector('#Signup-btn');
let navLoginBtn = document.querySelector('#login-btn');
let navLogoutBtn = document.querySelector('#Logout-btn');
let emailVerificationMessageBox = document.querySelector('#verificattion-box');
let alertBox = document.querySelector('#alert-box');
let alertMessage = document.querySelector('#alert-message');
let todoList = document.querySelector('.todo-list');
let loginEmailInput = document.querySelector('#Login-Email-input');
let loginPasswordInput = document.querySelector('#Login-passowrd-input');
let loader = document.querySelector('#loader-container');

document.addEventListener('click', (e) => {
    const elem = e.target;
    if (elem.id === "add-task") {
        e.preventDefault()
        if (!isValid(TaskInput)) return
        showBlockElem(loader)
        addTaskToFirebase()
        .finally(()=> hideElem(loader))

    } else if (elem.id === 'jump-to-login' || elem.id === 'login-btn') {
        showLoginForm()

    } else if (elem.id === 'jump-to-signup' || elem.id === 'Signup-btn') {
        showSignupForm()

    } else if (elem.id === 'signup-form-btn') {
        e.preventDefault()
        showBlockElem(loader)
        if (!isValid(SignupFormEmailInput, SignupFormPasswordInput)) return;
        signup(SignupFormEmailInput.value, SignupFormPasswordInput.value)
        .finally(()=> hideElem(loader))

    } else if (elem.id === 'alert-close-btn') {
        hideElem(alertBox)
    } else if (elem.id === 'Logout-btn') {
        showBlockElem(loader)
        getLogout()
        .finally(()=> hideElem(loader))

    } else if (elem.id === 'get-verification-link-btn') {
        showBlockElem(loader)
        verifyEmail()
        .finally(()=> hideElem(loader))

    } else if (elem.id === 'login-form-btn') {
        e.preventDefault()
        if (!isValid(loginEmailInput, loginPasswordInput)) return;
        showBlockElem(loader)
        getLogin(loginEmailInput.value, loginPasswordInput.value)
        .finally(()=> hideElem(loader))


    } else if (elem.className.includes('fa-xmark')) {
        hideElem(signupForm, loginForm);
        resetInput(SignupFormEmailInput, SignupFormPasswordInput)


    } else if (elem.className.includes('task-check')) {
        changeTaskState(elem.parentElement.dataset.id, elem.checked);

    } else if (elem.className.includes('delete-btn')) {
        showBlockElem(loader)
        deleteTask(elem.parentElement.dataset.id)
        .finally(()=> hideElem(loader))

    } else if (elem.className.includes('edit-btn')) {
        editTask(elem.parentElement);

    } else if (elem.className.includes('Edit-done')) {
        doneEditTask(elem.parentElement)
        .finally(()=> hideElem(loader))
        
    }
});

function editTask(taskContainer) {
    hideElem(taskContainer.querySelector('.edit-btn'), taskContainer.querySelector('.delete-btn') , taskContainer.querySelector('.task-check'));
    showBlockElem(taskContainer.querySelector('.Edit-done'));
    let taskElem = taskContainer.querySelector('.task-text');
    taskElem.classList.add('task-text-input');
    taskElem.contentEditable = true;
    taskElem.focus();

}

async function doneEditTask(taskContainer) {
    let docId = taskContainer.dataset.id;
    let docRef = doc(db , auth.currentUser.email , docId);
    taskContainer.querySelector('.task-text').classList.remove('task-text-input');
    hideElem(taskContainer.querySelector('.Edit-done'));
    showBlockElem( taskContainer.querySelector('.edit-btn'), taskContainer.querySelector('.delete-btn') , taskContainer.querySelector('.task-check') , loader);
    let editedTask = taskContainer.querySelector('.task-text').textContent;
    await setDoc(docRef , {task : editedTask} , {merge : true});
    getTodoList(auth.currentUser.email);

}

async function addTaskToFirebase() {
    try {
        if (!auth.currentUser) throw new Error('Login to your account to add task!');
        let task = TaskInput.value;
        let userEmail = auth.currentUser.email;
        let taskCollection = collection(db, userEmail)

        await addDoc(taskCollection, {
            task: task,
            isDone: false
        });
        showAlert('Your Task has successfull add!');
        getTodoList(auth.currentUser.email);
        TaskInput.value = '';

    } catch (error) {
        showAlert(`Failed to add tasks<br>${error.message}`);
    }

}



async function signup(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        hideElem(signupForm)
        showAlert("✅ Signup successful!");
        resetInput(SignupFormEmailInput, SignupFormPasswordInput)
    } catch (error) {
        showAlert(`Some error occured <br>${error.message}`);
    }

}

async function verifyEmail() {
    let user = auth.currentUser;
    await sendEmailVerification(user, {
        url: 'https://hassan-todo-list.netlify.app/'
    });
    showAlert('Email verification link has sent. Check your inbox to verify your email. it can be in your spam folder.')
}

function showSignupForm() {
    showBlockElem(signupForm)
    hideElem(loginForm)
}

function showLoginForm() {
    hideElem(signupForm);
    showBlockElem(loginForm)
}

function isValid(...elems) {
    for (const elem of elems) {
        if (elem.value === '') {
            showAlert('Oops, one or more input field is empty!');
            return false
        }
    }
    return true
}

onAuthStateChanged(auth, async (user) => {
    try {

        if (user) {
            hideElem(navSignupBtn, navLoginBtn)
            showBlockElem(navLogoutBtn)
            await user.reload();
            user.emailVerified ? hideElem(emailVerificationMessageBox) : showFlexElem(emailVerificationMessageBox);
            getTodoList(user.email)

        } else {
            showBlockElem(navSignupBtn, navLoginBtn);
            hideElem(navLogoutBtn);
            hideElem(emailVerificationMessageBox);
            todoList.innerHTML = `Login to your account to see your task!`
        }

    } catch (error) {

        showAlert(`Some error occured. ${error.message}`)

    } finally {
        hideElem(loader)
    }
})

function showBlockElem(...elems) {
    elems.forEach(elem => elem.style.display = 'block')
}

function showFlexElem(...elems) {
    elems.forEach(elem => elem.style.display = 'flex');
}

function hideElem(...elems) {
    elems.forEach(elem => elem.style.display = 'none')
}

function showAlert(message) {
    alertMessage.innerHTML = message;
    showFlexElem(alertBox)
}

async function getLogout() {
    try {
        await signOut(auth);
        showAlert('You have sccessfully logout!')
    } catch (error) {
        showAlert(`Some error occured<br>${error.message}`)
    }
}

async function getLogin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password)
        hideElem(loginForm)
        showAlert('You have successfully login to your account!')
        resetInput(loginEmailInput, loginPasswordInput)
    } catch (error) {
        showAlert(`Login failed!<br>${error.message}`)
    }
}

function resetInput(...inputs) {
    inputs.forEach(input => input.value = '')
}

async function getTodoList(email) {
    try {
        const taskCollection = collection(db, email);
        const querSnapshot = await getDocs(taskCollection);
        let tasks = []
        querSnapshot?.forEach((doc) => {
            tasks.push({
                id: doc.id,
                ...doc.data()
            })
        });

        renderTasks(tasks)

    } catch (error) {

        showAlert(`Failed to get tasks.<br>${error.message}`)

    }

}
function renderTasks(tasks) {
    todoList.innerHTML = '';
    tasks.forEach((task) => {
        let newElem = document.createElement('li');
        newElem.classList.add('todo-item');
        newElem.dataset.id = task.id;

        newElem.innerHTML = `
                <input type="checkbox" class="task-check" ${task.isDone ? "checked" : ""}>
                <span class="task-text" contenteditable="false">${task.task}</span>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
                <button class="Edit-done">Done</button>
            `;

        todoList.appendChild(newElem);
    });
}

async function changeTaskState(docID, taskState) {
    try {
        await auth.currentUser.reload();
        let docRef = doc(db, auth.currentUser.email, docID);
        await setDoc(docRef, { isDone: taskState }, { merge: true });
        getTodoList(auth?.currentUser?.email)
    }
    catch (error) {
        showAlert('Some error occured')
    }

}

async function deleteTask(docId) {
    try {
        await auth.currentUser.reload();
        let docRef = doc(db , auth.currentUser.email , docId);
        await deleteDoc(docRef);
        getTodoList(auth.currentUser.email)
    } catch (error) {
        showAlert(`Failed to delete task<br>${error.message}`)
    }
}