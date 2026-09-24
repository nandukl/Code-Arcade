/* ==========================================================================
   CODE ARCADE - SITE CONFIG  (edit this file only)
   --------------------------------------------------------------------------
   Forms are sent as JSON to `formEndpoint`. Works out of the box with:
     - Web3Forms : endpoint "https://api.web3forms.com/submit"
                   + accessKey from https://web3forms.com (free, no backend)
     - Formspree : endpoint "https://formspree.io/f/XXXXXXXX" (leave accessKey "")
   If formEndpoint is left empty, forms fall back to opening the visitor's
   email app with the message pre-filled, so no enquiry is ever lost.
   ========================================================================== */
window.CA_CONFIG = {
  formEndpoint: "",
  accessKey: "",
  contactEmail: "codearcade20@gmail.com"
};
