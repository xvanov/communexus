// Page Object Model for Authentication Screen
// Phase 3.5.1: Appium Setup & Automated Testing Infrastructure

export class AuthScreen {
    // Selectors
    private emailInput = '~email-input';
    private passwordInput = '~password-input';
    private signInButton = '~sign-in-button';
    private signUpButton = '~sign-up-button';
    private testUserButton = '~test-user-button';
    private errorMessage = '~error-message';
    private loadingIndicator = '~loading-indicator';

    // Actions
    async enterEmail(email: string) {
        await $(this.emailInput).setValue(email);
    }

    async enterPassword(password: string) {
        await $(this.passwordInput).setValue(password);
    }

    async tapSignIn() {
        await $(this.signInButton).click();
    }

    async tapSignUp() {
        await $(this.signUpButton).click();
    }

    async tapTestUser() {
        await $(this.testUserButton).click();
    }

    async waitForLoadingToComplete() {
        await $(this.loadingIndicator).waitForDisplayed({ timeout: 10000, reverse: true });
    }

    async waitForErrorMessage() {
        await $(this.errorMessage).waitForDisplayed({ timeout: 5000 });
    }

    async getErrorMessage() {
        return await $(this.errorMessage).getText();
    }

    // Verification methods
    async isDisplayed() {
        return await $(this.emailInput).isDisplayed();
    }

    async isSignInButtonEnabled() {
        return await $(this.signInButton).isEnabled();
    }

    // Complete authentication flow
    async signInWithCredentials(email: string, password: string) {
        await this.enterEmail(email);
        await this.enterPassword(password);
        await this.tapSignIn();
        await this.waitForLoadingToComplete();
    }

    async signInAsTestUser() {
        await this.tapTestUser();
        await this.waitForLoadingToComplete();
    }
}


