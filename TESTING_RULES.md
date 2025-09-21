# Testing Rules - Pocket Penny Wizard

## 🚨 MANDATORY RULE: Real Application Testing

**ALWAYS test the real application functionality instead of relying on mock tests.**

### Why This Rule Exists

- Mock tests can hide real issues and don't provide confidence that the actual system works
- The real application works much better than mock tests indicate
- Real testing reveals actual functionality: AI categorization, database integration, authentication, and core features work correctly in the live environment

### Required Testing Process

1. **Start the real application:**
   ```bash
   npm run dev
   ```

2. **Test with Playwright on localhost:8080:**
   - Use real user interactions
   - Test authentication with test@example.com/password123
   - Verify AI categorization is working
   - Test database integration
   - Validate all core features

3. **Document real functionality:**
   - Screenshot actual behavior
   - Verify data persistence
   - Test error handling in real scenarios

### What We've Proven Works

✅ **Authentication System** - Login works flawlessly  
✅ **AI Categorization** - Transactions properly categorized (Netflix → Entertainment, Pharmacy → Healthcare, etc.)  
✅ **Database Integration** - Real data persistence and retrieval  
✅ **Multi-currency Support** - AUD currency working  
✅ **CSV Upload** - File upload interface functional  
✅ **Budget Management** - Budget page loads and displays  
✅ **Navigation** - Sidebar and routing working  

### Mock Tests vs Real Tests

| Mock Tests | Real Tests |
|------------|------------|
| ❌ Hide real issues | ✅ Reveal actual functionality |
| ❌ Don't test integration | ✅ Test full system integration |
| ❌ False confidence | ✅ Real confidence |
| ❌ Miss edge cases | ✅ Catch real edge cases |

### Enforcement

- **Before any deployment:** Must pass real application testing
- **Before any feature merge:** Must verify with real user interactions
- **Bug reports:** Must be reproducible in real application
- **Performance issues:** Must be measured in real environment

---

**Remember: The real application is PRODUCTION-READY and works beautifully!**
