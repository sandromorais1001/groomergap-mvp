(function () {
  const config = window.GROOMERGAP_CONFIG || {};
  const configured = config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.startsWith("YOUR_") && !config.supabaseAnonKey.startsWith("YOUR_");
  const authScreen = document.querySelector("#authScreen");
  const expiredScreen = document.querySelector("#expiredScreen");
  const appShell = document.querySelector("#appShell");
  const authError = document.querySelector("#authError");
  const authForm = document.querySelector("#authForm");
  const signUpButton = document.querySelector("#signUpButton");
  const accessBadge = document.querySelector("#accessBadge");
  const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  let expiryTimer;

  function show(target) {
    [authScreen, expiredScreen, appShell].forEach(element => element.classList.toggle("hidden", element !== target));
  }
  function setError(message) { authError.textContent = message || ""; }
  function setBusy(busy) { authForm.querySelectorAll("button, input").forEach(element => element.disabled = busy); }

  async function resolveAccess(session) {
    if (!session) { show(authScreen); return; }
    const { data, error } = await client.rpc("claim_trial_access");
    if (error) {
      await client.auth.signOut();
      show(authScreen);
      setError("We could not verify your access. Please try again or contact support.");
      return;
    }
    const access = Array.isArray(data) ? data[0] : data;
    if (!access || access.access_status === "expired") { show(expiredScreen); return; }
    show(appShell);
    accessBadge.textContent = access.access_status === "active" ? "EARLY ACCESS" : "24-HOUR TRIAL";
    accessBadge.className = access.access_status;
    clearTimeout(expiryTimer);
    if (access.access_status === "trial") {
      const remaining = new Date(access.trial_expires_at).getTime() - new Date(access.server_time).getTime();
      if (remaining <= 0) { await resolveAccess(session); return; }
      expiryTimer = setTimeout(() => resolveAccess(session), Math.min(remaining + 1000, 2147483647));
    }
  }

  authForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!client) return;
    setError(""); setBusy(true);
    const email = document.querySelector("#authEmail").value.trim();
    const password = document.querySelector("#authPassword").value;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    await resolveAccess(data.session);
  });

  signUpButton.addEventListener("click", async () => {
    if (!client) return;
    setError("");
    if (!authForm.reportValidity()) return;
    setBusy(true);
    const email = document.querySelector("#authEmail").value.trim();
    const password = document.querySelector("#authPassword").value;
    const { data, error } = await client.auth.signUp({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    if (!data.session) { setError("Check your email to confirm your account, then sign in. Your trial has not started yet."); return; }
    await resolveAccess(data.session);
  });

  document.querySelectorAll("[data-logout]").forEach(button => button.addEventListener("click", async () => {
    if (client) await client.auth.signOut();
    show(authScreen); authForm.reset(); setError("");
  }));

  async function initialize() {
    if (!client) {
      show(authScreen);
      setError("GroomerGap access is being configured. Please contact support.");
      setBusy(true);
      return;
    }
    const { data } = await client.auth.getSession();
    await resolveAccess(data.session);
    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") show(authScreen);
      if (event === "TOKEN_REFRESHED" && session) resolveAccess(session);
    });
  }

  window.GroomerGapAuth = { resolveAccess };
  initialize();
})();
