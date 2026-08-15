/* =========================================================
   DOSTEA — GLOBAL AUTH
   auth.js
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

    if (!window.supabaseClient) {

    console.error(
        "DOSTEA: Supabase client not loaded."
    );

    return;

}

    /* =====================================================
       PAGE SETTINGS
    ====================================================== */

    const currentPage =
        window.location.pathname
            .split("/")
            .pop() || "index.html";


    const protectedPages = [
        "profile.html",
        "orders.html"
    ];


    const guestOnlyPages = [
        "login.html",
        "signup.html"
    ];


    /* =====================================================
       GET CURRENT SESSION
    ====================================================== */

    async function getCurrentSession() {

        const {
            data,
            error
        } = await window.supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error.message
            );

            return null;

        }


        return data.session;

    }


    /* =====================================================
       GET USER DISPLAY DATA
    ====================================================== */

    function getUserData(user) {

        if (!user) {
            return null;
        }


        const metadata =
            user.user_metadata || {};


        const fullName =
            metadata.full_name ||
            metadata.name ||
            metadata.display_name ||
            user.email?.split("@")[0] ||
            "DOSTEA User";


        const initials =
            fullName
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(function (word) {

                    return word
                        .charAt(0)
                        .toUpperCase();

                })
                .join("") || "D";


        return {

            id: user.id,

            email:
                user.email || "",

            fullName:
                fullName,

            initials:
                initials,

            avatar:
                metadata.avatar_url ||
                metadata.picture ||
                ""

        };

    }


    /* =====================================================
       UPDATE PAGE USER UI
    ====================================================== */

    function updateUserUI(user) {

        const userData =
            getUserData(user);


        const sidebarName =
            document.getElementById(
                "sidebarUserName"
            );


        const sidebarAvatar =
            document.getElementById(
                "sidebarAvatar"
            );


        const topProfileName =
            document.getElementById(
                "topProfileName"
            );


        const topProfileAvatar =
            document.getElementById(
                "topProfileAvatar"
            );


        if (!userData) {

            if (sidebarName) {
                sidebarName.textContent =
                    "Guest";
            }

            if (sidebarAvatar) {
                sidebarAvatar.textContent =
                    "D";
            }

            if (topProfileName) {
                topProfileName.textContent =
                    "Guest";
            }

            if (topProfileAvatar) {
                topProfileAvatar.textContent =
                    "D";
            }

            return;

        }


        if (sidebarName) {

            sidebarName.textContent =
                userData.fullName;

        }


        if (sidebarAvatar) {

            sidebarAvatar.textContent =
                userData.initials;

        }


        if (topProfileName) {

            topProfileName.textContent =
                userData.fullName;

        }


        if (topProfileAvatar) {

            topProfileAvatar.textContent =
                userData.initials;

        }

    }


    /* =====================================================
       OLD LOCALSTORAGE COMPATIBILITY
    ====================================================== */

    function syncLegacyUser(user) {

        if (!user) {

            localStorage.removeItem(
                "dostea_current_user"
            );

            return;

        }


        const userData =
            getUserData(user);


        localStorage.setItem(
            "dostea_current_user",
            JSON.stringify({

                id:
                    userData.id,

                email:
                    userData.email,

                fullName:
                    userData.fullName,

                name:
                    userData.fullName,

                avatar:
                    userData.avatar

            })
        );

    }


    /* =====================================================
       LOGIN / GUEST VISIBILITY
    ====================================================== */

    function updateAuthVisibility(user) {

        const isLoggedIn =
            Boolean(user);


        document
            .querySelectorAll(
                ".auth-logged-in"
            )
            .forEach(function (element) {

                element.style.display =
                    isLoggedIn
                        ? ""
                        : "none";

            });


        document
            .querySelectorAll(
                ".auth-guest"
            )
            .forEach(function (element) {

                element.style.display =
                    isLoggedIn
                        ? "none"
                        : "";

            });

    }


    /* =====================================================
       PROTECTED PAGE CHECK
    ====================================================== */

    function handlePageProtection(session) {

        const loggedIn =
            Boolean(session?.user);


        if (
            protectedPages.includes(
                currentPage
            ) &&
            !loggedIn
        ) {

            localStorage.setItem(
                "dostea_redirect_after_login",
                currentPage
            );


            window.location.replace(
                "login.html"
            );

            return;

        }


        if (
            guestOnlyPages.includes(
                currentPage
            ) &&
            loggedIn
        ) {

            window.location.replace(
                "index.html"
            );

        }

    }


    /* =====================================================
       LOGOUT
    ====================================================== */

    async function logoutUser() {

        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(
                "Logout error:",
                error.message
            );

            alert(
                "Unable to log out. Please try again."
            );

            return;

        }


        localStorage.removeItem(
            "dostea_current_user"
        );


        window.location.replace(
            "index.html"
        );

    }


    /* =====================================================
       ATTACH LOGOUT BUTTONS
    ====================================================== */

    function attachLogoutButtons() {

        document
            .querySelectorAll(
                "[data-dostea-logout], .logout-btn"
            )
            .forEach(function (button) {

                if (
                    button.dataset
                        .authListenerAdded ===
                    "true"
                ) {
                    return;
                }


                button.dataset
                    .authListenerAdded =
                    "true";


                button.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();

                        logoutUser();

                    }
                );

            });

    }


    /* =====================================================
       INITIAL AUTH LOAD
    ====================================================== */

    const session =
        await getCurrentSession();


    const currentUser =
        session?.user || null;


    syncLegacyUser(
        currentUser
    );


    updateUserUI(
        currentUser
    );


    updateAuthVisibility(
        currentUser
    );


    attachLogoutButtons();


    handlePageProtection(
        session
    );


    /* =====================================================
       AUTH STATE LISTENER
    ====================================================== */

    supabaseClient
        .auth
        .onAuthStateChange(
            function (
                event,
                newSession
            ) {

                const user =
                    newSession?.user ||
                    null;


                syncLegacyUser(
                    user
                );


                updateUserUI(
                    user
                );


                updateAuthVisibility(
                    user
                );


                attachLogoutButtons();


                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    if (
                        protectedPages.includes(
                            currentPage
                        )
                    ) {

                        window.location.replace(
                            "login.html"
                        );

                    }

                }

            }
        );


    /* =====================================================
       MAKE LOGOUT AVAILABLE GLOBALLY
    ====================================================== */

    window.dosteaLogout =
        logoutUser;

});