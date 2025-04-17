/**
 * تكامل نظام المصادقة مع تطبيق نظام الاستثمار المتكامل
 * يربط بين نظام المصادقة والتطبيق الرئيسي
 */

// وظائف تكامل نظام المصادقة
const AuthIntegration = (function() {
    // المتغيرات الخاصة
    let authSystem = null;
    let firebaseSync = null;
    
    /**
     * تهيئة تكامل المصادقة
     * @param {Object} auth نظام المصادقة
     * @param {Object} sync نظام المزامنة مع Firebase
     */
    function initialize(auth, sync) {
        console.log('تهيئة تكامل المصادقة...');
        
        if (!auth) {
            console.error('نظام المصادقة غير متوفر');
            return;
        }
        
        authSystem = auth;
        firebaseSync = sync;
        
        // إضافة نموذج المصادقة إلى التطبيق
        injectAuthTemplate();
        
        // إضافة مراقب لأحداث المصادقة
        authSystem.addAuthObserver(handleAuthEvent);
        
        // إعداد مستمعي الأحداث
        setupEventListeners();
        
        console.log('تم تهيئة تكامل المصادقة');
    }
    
    /**
     * إدراج نموذج المصادقة في التطبيق
     */
    function injectAuthTemplate() {
        // التحقق مما إذا كان نموذج المصادقة موجوداً بالفعل
        if (document.getElementById('auth-modal')) {
            console.log('نموذج المصادقة موجود بالفعل');
            return;
        }
        
        // إدراج نموذج المصادقة من ملف HTML
        fetch('auth-modal.html')
            .then(response => response.text())
            .then(html => {
                // إنشاء عنصر div
                const div = document.createElement('div');
                div.innerHTML = html;
                
                // إدراج نموذج المصادقة في الصفحة
                document.body.appendChild(div);
                
                // إعداد مستمعي أحداث المصادقة
                setupAuthEventListeners();
                
                console.log('تم إدراج نموذج المصادقة');
            })
            .catch(error => {
                console.error('خطأ في إدراج نموذج المصادقة:', error);
                
                // استخدام نموذج المصادقة الاحتياطي
                injectFallbackAuthTemplate();
            });
    }
    
    /**
     * إدراج نموذج المصادقة الاحتياطي
     */
    function injectFallbackAuthTemplate() {
        // إنشاء نموذج مصادقة بسيط برمجياً
        const authModalHTML = `
            <div class="auth-modal-overlay" id="auth-modal">
                <div class="auth-modal">
                    <div class="auth-modal-header">
                        <h3 class="auth-modal-title">تسجيل الدخول</h3>
                        <button class="auth-modal-close" id="auth-modal-close">&times;</button>
                    </div>
                    
                    <div class="auth-modal-body">
                        <div class="auth-error" id="auth-error"></div>
                        
                        <form class="auth-form" id="auth-form">
                            <div class="auth-form-group">
                                <label class="auth-label" for="auth-email">البريد الإلكتروني</label>
                                <input class="auth-input" type="email" id="auth-email" placeholder="أدخل بريدك الإلكتروني" required>
                            </div>
                            <div class="auth-form-group">
                                <label class="auth-label" for="auth-password">كلمة المرور</label>
                                <input class="auth-input" type="password" id="auth-password" placeholder="أدخل كلمة المرور" required>
                            </div>
                            
                            <button class="auth-button auth-button-primary" type="button" id="login-btn">تسجيل الدخول</button>
                            <button class="auth-button auth-button-outline" type="button" id="signup-btn" style="margin-top: 10px;">إنشاء حساب</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        // إنشاء عنصر div
        const div = document.createElement('div');
        div.innerHTML = authModalHTML;
        
        // إدراج نموذج المصادقة في الصفحة
        document.body.appendChild(div);
        
        // إعداد مستمعي أحداث المصادقة الأساسية
        document.getElementById('login-btn')?.addEventListener('click', handleLogin);
        document.getElementById('signup-btn')?.addEventListener('click', handleSignup);
        document.getElementById('auth-modal-close')?.addEventListener('click', () => hideAuthModal());
        
        console.log('تم إدراج نموذج المصادقة الاحتياطي');
    }
    
    /**
     * إعداد مستمعي الأحداث العامة
     */
    function setupEventListeners() {
        // زر تسجيل الدخول في الهيدر
        const headerLoginBtn = document.getElementById('header-login-btn');
        if (headerLoginBtn) {
            headerLoginBtn.addEventListener('click', () => {
                if (authSystem) {
                    authSystem.showAuthModal();
                }
            });
        }
        
        // التأكد من أن التطبيق محمي بالمصادقة
        document.addEventListener('DOMContentLoaded', () => {
            // إخفاء محتوى التطبيق حتى يتم التحقق من المصادقة
            const mainContent = document.querySelector('.main-content');
            if (mainContent && !document.body.classList.contains('authenticated')) {
                mainContent.style.visibility = 'hidden';
                
                // استعادة الرؤية بعد التحقق من المصادقة
                window.addEventListener('auth:initialized', () => {
                    mainContent.style.visibility = 'visible';
                });
            }
        });
    }
    
    /**
     * إعداد مستمعي أحداث المصادقة
     */
    function setupAuthEventListeners() {
        // أزرار تبديل نافذة المصادقة
        const switchToSignupLink = document.getElementById('switch-to-signup');
        if (switchToSignupLink) {
            switchToSignupLink.addEventListener('click', function(e) {
                e.preventDefault();
                switchAuthTab('signup');
            });
        }
        
        const switchToLoginLink = document.getElementById('switch-to-login');
        if (switchToLoginLink) {
            switchToLoginLink.addEventListener('click', function(e) {
                e.preventDefault();
                switchAuthTab('login');
            });
        }
        
        // رابط استعادة كلمة المرور
        const forgotPasswordLink = document.getElementById('forgot-password');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                switchAuthTab('reset');
            });
        }
        
        // رابط العودة إلى تسجيل الدخول
        const backToLoginLink = document.getElementById('back-to-login');
        if (backToLoginLink) {
            backToLoginLink.addEventListener('click', function(e) {
                e.preventDefault();
                switchAuthTab('login');
            });
        }
        
        // زر إغلاق نافذة المصادقة
        const closeButton = document.getElementById('auth-modal-close');
        if (closeButton) {
            closeButton.addEventListener('click', hideAuthModal);
        }
        
        // نماذج المصادقة
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleLogin();
            });
        }
        
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleSignup();
            });
        }
        
        const resetForm = document.getElementById('reset-form');
        if (resetForm) {
            resetForm.addEventListener('submit', function(e) {
                e.preventDefault();
                handleResetPassword();
            });
        }
        
        // زر تسجيل الخروج
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
                    if (authSystem) {
                        authSystem.logout();
                    }
                }
            });
        }
    }
    
    /**
     * معالجة أحداث المصادقة
     * @param {Object} event حدث المصادقة
     */
    function handleAuthEvent(event) {
        console.log('حدث مصادقة:', event.type);
        
        switch (event.type) {
            case 'login':
                // تحديث واجهة المستخدم بعد تسجيل الدخول
                document.body.classList.add('authenticated');
                hideAuthModal();
                updateUserInfo(event.user);
                
                // مزامنة البيانات مع Firebase
                if (firebaseSync && typeof firebaseSync.syncFromFirebase === 'function') {
                    firebaseSync.syncFromFirebase().catch(err => console.error('خطأ في مزامنة البيانات:', err));
                }
                
                // تحميل بيانات المستخدم
                if (window._enhancedLoadData) {
                    window._enhancedLoadData();
                } else if (window.loadData) {
                    window.loadData();
                }
                
                // إظهار إشعار للمستخدم
                if (window.showNotification) {
                    window.showNotification(`مرحباً بك ${event.user.displayName || 'في النظام'}`, 'success');
                }
                
                break;
                
            case 'logout':
                // تحديث واجهة المستخدم بعد تسجيل الخروج
                document.body.classList.remove('authenticated');
                showAuthModal();
                
                // إظهار إشعار للمستخدم
                if (window.showNotification) {
                    window.showNotification('تم تسجيل الخروج بنجاح', 'info');
                }
                
                break;
                
            case 'signup':
                // تحديث واجهة المستخدم بعد إنشاء حساب
                document.body.classList.add('authenticated');
                hideAuthModal();
                updateUserInfo(event.user);
                
                // إظهار رسالة ترحيب
                if (window.showNotification) {
                    window.showNotification(`مرحباً بك ${event.user.displayName || 'في النظام'}! تم إنشاء حسابك بنجاح.`, 'success');
                }
                
                break;
        }
        
        // إطلاق حدث مخصص للتطبيق
        const customEvent = new CustomEvent('auth:' + event.type, { detail: event });
        window.dispatchEvent(customEvent);
    }
    
    /**
     * معالجة تسجيل الدخول
     */
    function handleLogin() {
        const emailInput = document.getElementById('login-email') || document.getElementById('auth-email');
        const passwordInput = document.getElementById('login-password') || document.getElementById('auth-password');
        
        if (!emailInput || !passwordInput) {
            showError('خطأ في العثور على عناصر النموذج');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        if (!email || !password) {
            showError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        
        if (authSystem) {
            authSystem.login(email, password).catch(error => {
                console.error('فشل تسجيل الدخول:', error);
                showError(error.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك والمحاولة مرة أخرى.');
            });
        } else if (firebaseSync && firebaseSync.login) {
            // استخدام firebaseSync كبديل إذا كان متاحاً
            firebaseSync.login(email, password).catch(error => {
                console.error('فشل تسجيل الدخول:', error);
                showError(error.message || 'فشل تسجيل الدخول. يرجى التحقق من بياناتك والمحاولة مرة أخرى.');
            });
        }
    }
    
    /**
     * معالجة إنشاء حساب
     */
    function handleSignup() {
        const nameInput = document.getElementById('signup-name');
        const emailInput = document.getElementById('signup-email') || document.getElementById('auth-email');
        const passwordInput = document.getElementById('signup-password') || document.getElementById('auth-password');
        const confirmPasswordInput = document.getElementById('signup-confirm-password');
        
        if (!emailInput || !passwordInput) {
            showError('خطأ في العثور على عناصر النموذج');
            return;
        }
        
        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : password;
        
        if (!email || !password) {
            showError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
            return;
        }
        
        if (confirmPasswordInput && password !== confirmPassword) {
            showError('كلمتا المرور غير متطابقتين');
            return;
        }
        
        if (password.length < 6) {
            showError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل');
            return;
        }
        
        if (authSystem) {
            authSystem.signup(email, password, name).catch(error => {
                console.error('فشل إنشاء الحساب:', error);
                showError(error.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
            });
        } else if (firebaseSync && firebaseSync.signup) {
            // استخدام firebaseSync كبديل إذا كان متاحاً
            firebaseSync.signup(email, password).catch(error => {
                console.error('فشل إنشاء الحساب:', error);
                showError(error.message || 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
            });
        }
    }
    
    /**
     * معالجة إعادة تعيين كلمة المرور
     */
    function handleResetPassword() {
        const emailInput = document.getElementById('reset-email');
        
        if (!emailInput) {
            showError('خطأ في العثور على عناصر النموذج');
            return;
        }
        
        const email = emailInput.value.trim();
        
        if (!email) {
            showError('الرجاء إدخال البريد الإلكتروني');
            return;
        }
        
        if (authSystem) {
            authSystem.resetPassword(email)
                .then(() => {
                    // إظهار رسالة نجاح
                    const successElement = document.getElementById('reset-success');
                    if (successElement) {
                        successElement.textContent = `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}`;
                        successElement.style.display = 'block';
                        
                        // إخفاء الرسالة بعد 5 ثوانٍ
                        setTimeout(() => {
                            successElement.style.display = 'none';
                        }, 5000);
                    }
                })
                .catch(error => {
                    console.error('فشل إرسال رابط إعادة تعيين كلمة المرور:', error);
                    showError(error.message || 'فشل إرسال رابط إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.');
                });
        }
    }
    
    /**
     * التبديل بين علامات تبويب المصادقة
     * @param {string} tab اسم علامة التبويب (login, signup, reset)
     */
    function switchAuthTab(tab) {
        // إخفاء جميع علامات التبويب
        const tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(t => t.classList.remove('active'));
        
        // إظهار علامة التبويب المطلوبة
        const selectedTab = document.getElementById(`${tab}-tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // تحديث عنوان النافذة
        const modalTitle = document.querySelector('.auth-modal-title');
        if (modalTitle) {
            switch (tab) {
                case 'login':
                    modalTitle.textContent = 'تسجيل الدخول';
                    break;
                case 'signup':
                    modalTitle.textContent = 'إنشاء حساب جديد';
                    break;
                case 'reset':
                    modalTitle.textContent = 'استعادة كلمة المرور';
                    break;
            }
        }
        
        // تحديث تذييل النافذة
        const loginFooter = document.getElementById('login-footer');
        const signupFooter = document.getElementById('signup-footer');
        
        if (loginFooter && signupFooter) {
            if (tab === 'login' || tab === 'reset') {
                loginFooter.style.display = 'block';
                signupFooter.style.display = 'none';
            } else {
                loginFooter.style.display = 'none';
                signupFooter.style.display = 'block';
            }
        }
        
        // إخفاء أي رسائل خطأ سابقة
        const errorElement = document.getElementById('auth-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    /**
     * تحديث معلومات المستخدم في واجهة المستخدم
     * @param {Object} user معلومات المستخدم
     */
    function updateUserInfo(user) {
        if (!user) return;
        
        // تحديث اسم المستخدم
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.displayName || user.email.split('@')[0];
        }
        
        // تحديث البريد الإلكتروني
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
        }
        
        // تحديث الصورة الرمزية
        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement) {
            if (user.photoURL) {
                userAvatarElement.innerHTML = `<img src="${user.photoURL}" alt="${user.displayName || 'المستخدم'}">`;
            } else {
                // استخدام الحرف الأول من اسم المستخدم كصورة رمزية
                const initial = (user.displayName || user.email)[0].toUpperCase();
                userAvatarElement.textContent = initial;
            }
        }
    }
    
    /**
     * إظهار رسالة خطأ
     * @param {string} message نص الرسالة
     */
    function showError(message) {
        const errorElement = document.getElementById('auth-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // إخفاء الرسالة بعد 5 ثوانٍ
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }
    
    /**
     * إظهار نافذة المصادقة
     */
    function showAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.add('active');
            
            // إعادة تعيين النماذج
            document.getElementById('login-form')?.reset();
            document.getElementById('signup-form')?.reset();
            document.getElementById('reset-form')?.reset();
            
            // التأكد من أن علامة تبويب تسجيل الدخول هي النشطة
            switchAuthTab('login');
            
            // إزالة أي رسائل خطأ
            const errorElement = document.getElementById('auth-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }
    }
    
    /**
     * إخفاء نافذة المصادقة
     */
    function hideAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.remove('active');
        }
    }