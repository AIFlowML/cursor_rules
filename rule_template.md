## Framework
<FRAMEWORK>
<!-- Insert Framework here -->
</FRAMEWORK>

## Date
<DATE>
<!-- Insert latest date here -->
</DATE>

> You are a prompt engineer. You are creating rules for the <FRAMEWORK> framework.

### Steps
1. Research for the latest <DATE> best practices, rules, coding guidelines for the framework <FRAMEWORK>.
2. Create a rule in Markdown format.
3. It must always follow the <PROMPT_LAYOUT>.

### Must Follow Rules
- Never add or wrap double ticks around description or globs.
- Use full sentences and avoid the typescript variant instead of js when using the framework if possible; prefer the typescript variant.
- Avoid redundant rules.
- Avoid common web design and web development rules; only include framework and library-specific rules.
- Avoid rules that are well-known and obvious (LLMs already know these rules).
- You have to add rules that are extremely important for the current framework version.

### Format
1. Remove all bold Markdown asterisk; not needed.
2. Remove the h1 heading.

<PROMPT_LAYOUT>
Filename: add-<INSERT_FILENAME>.mdc

---

Description: <framework+version>

Globs: {add here file globs like **/*.tsx, **/*.ts, **/*.js}

AlwaysApply: {if the rule should apply globally, true or false}
---

> You are an expert in <add here framework, typescript, libraries>. You are focusing on producing clear, readable code. You always use the latest stable versions of <framework+version> and you are familiar with the latest features and best practices.

## <Framework> Architecture Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Component A   │    │   Component B    │    │   Component C   │
│   Description   │───▶│   Description    │───▶│   Description   │
│                 │    │                  │    │                 │
│ - Feature 1     │    │ - Feature 1      │    │ - Feature 1     │
│ - Feature 2     │    │ - Feature 2      │    │ - Feature 2     │
│ - Feature 3     │    │ - Feature 3      │    │ - Feature 3     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Process 1     │    │   Process 2      │    │   Process 3     │
│   Description   │    │   Description    │    │   Description   │
│   Handling      │    │   Handling       │    │   Handling      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Project Structure

```
project-root/
├── src/
│   ├── main/
│   │   ├── index.ts           # Main entry point
│   │   ├── config.ts          # Configuration
│   │   └── types.ts           # Type definitions
│   ├── components/
│   │   ├── index.ts           # Component exports
│   │   ├── [component].ts     # Individual components
│   │   └── types.ts           # Component types
│   ├── services/
│   │   ├── index.ts           # Service exports
│   │   └── [service].ts       # Service implementations
│   ├── utils/
│   │   ├── validation.ts      # Validation helpers
│   │   ├── helpers.ts         # Utility functions
│   │   └── constants.ts       # Constants and configs
│   └── types/
│       ├── index.ts           # Global type exports
│       └── [domain].ts        # Domain-specific types
├── tests/
│   ├── unit/
│   ├── integration/
│   └── utils/
├── docs/
└── config/
```

## Core Implementation Patterns

### Basic Setup Pattern

```typescript
// ✅ DO: Use proper framework initialization
import { Framework } from "<framework>";
import { z } from "zod";

// Define configuration with types
interface FrameworkConfig {
  property1: string;
  property2: number;
  optionalProperty?: boolean;
}

const config: FrameworkConfig = {
  property1: "value",
  property2: 42,
  optionalProperty: true
};

// Initialize with comprehensive configuration
const instance = new Framework({
  ...config,
  // Framework-specific options
  validation: {
    enabled: true,
    strict: true
  },
  performance: {
    optimization: true,
    caching: true
  }
});

// ❌ DON'T: Use minimal or incorrect initialization
const badInstance = new Framework({
  property1: "value"  // Missing required properties
  // No configuration, validation, or error handling
});
```

### Configuration Management

```typescript
// ✅ DO: Environment-based configuration
const getConfig = () => {
  const env = process.env.NODE_ENV || "development";
  
  const baseConfig = {
    property1: process.env.PROPERTY1 || "default",
    property2: parseInt(process.env.PROPERTY2 || "0", 10)
  };
  
  if (env === "production") {
    return {
      ...baseConfig,
      optimization: true,
      logging: "error"
    };
  }
  
  return {
    ...baseConfig,
    optimization: false,
    logging: "debug"
  };
};

// ✅ DO: Validate configuration
const configSchema = z.object({
  property1: z.string().min(1),
  property2: z.number().positive(),
  optimization: z.boolean(),
  logging: z.enum(["debug", "info", "warn", "error"])
});

const config = configSchema.parse(getConfig());

// ❌ DON'T: Hardcode configuration values
const badConfig = {
  property1: "hardcoded-value",  // Not environment-aware
  property2: 42                  // Magic numbers
};
```

## Advanced Patterns

### Error Handling

```typescript
// ✅ DO: Implement comprehensive error handling
class FrameworkError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = "FrameworkError";
  }
}

class ValidationError extends FrameworkError {
  constructor(message: string, public field: string) {
    super(message, "VALIDATION_ERROR", { field });
    this.name = "ValidationError";
  }
}

// Error handling in operations
async function performOperation(data: unknown): Promise<Result> {
  try {
    // Validate input
    const validatedData = dataSchema.parse(data);
    
    // Perform operation
    const result = await processData(validatedData);
    
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Invalid input data",
        error.errors[0]?.path.join(".") || "unknown"
      );
    }
    
    if (error instanceof FrameworkError) {
      // Re-throw framework errors
      throw error;
    }
    
    // Handle unexpected errors
    throw new FrameworkError(
      "Operation failed",
      "OPERATION_ERROR",
      { originalError: error.message }
    );
  }
}

// ❌ DON'T: Use generic error handling
async function badOperation(data: any) {
  try {
    return await processData(data);
  } catch (error) {
    throw error;  // No error enrichment or context
  }
}
```

### Performance Optimization

```typescript
// ✅ DO: Implement performance optimizations
class PerformantFramework {
  private cache = new Map<string, any>();
  private timers = new Map<string, number>();
  
  async optimizedOperation(key: string, data: any): Promise<any> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // Track performance
    const startTime = Date.now();
    this.timers.set(key, startTime);
    
    try {
      // Perform operation
      const result = await heavyOperation(data);
      
      // Cache result
      this.cache.set(key, result);
      
      // Log performance metrics
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${key} took ${duration}ms`);
      }
      
      return result;
    } finally {
      this.timers.delete(key);
    }
  }
  
  // Clean cache periodically
  private setupCacheCleanup() {
    setInterval(() => {
      if (this.cache.size > 1000) {
        // Clear oldest entries
        const entries = Array.from(this.cache.entries());
        entries.slice(0, 500).forEach(([key]) => {
          this.cache.delete(key);
        });
      }
    }, 60000); // Every minute
  }
}

// ❌ DON'T: Ignore performance considerations
class SlowFramework {
  async operation(data: any): Promise<any> {
    // No caching, no performance tracking
    return await heavyOperation(data);
  }
}
```

## Validation and Type Safety

### Schema Validation

```typescript
// ✅ DO: Use comprehensive schema validation
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  roles: z.array(z.enum(["admin", "user", "moderator"])),
  metadata: z.record(z.string(), z.any()).optional()
});

type User = z.infer<typeof UserSchema>;

// Validation function
function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}

// Safe validation with error handling
function safeValidateUser(data: unknown): { success: true; data: User } | { success: false; error: string } {
  try {
    const user = UserSchema.parse(data);
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return { success: false, error: "Unknown validation error" };
  }
}

// ❌ DON'T: Skip validation or use weak typing
function processUser(data: any) {  // 'any' type
  // No validation
  return {
    name: data.name,
    email: data.email
  };
}
```

### Type Guards and Utilities

```typescript
// ✅ DO: Implement proper type guards
function isUser(value: unknown): value is User {
  return UserSchema.safeParse(value).success;
}

function assertUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new ValidationError("Invalid user data", "user");
  }
}

// Generic type utilities
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Usage example
type PartialUser = DeepPartial<User>;
type UserWithRequiredEmail = RequiredFields<PartialUser, "email">;

// ❌ DON'T: Use loose type checking
function isUserBad(value: any): boolean {
  return value && typeof value.name === "string";  // Insufficient validation
}
```

## Testing Patterns

### Unit Testing

```typescript
// ✅ DO: Comprehensive unit testing
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Framework Component", () => {
  let component: FrameworkComponent;
  
  beforeEach(() => {
    component = new FrameworkComponent({
      config: testConfig
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe("initialization", () => {
    it("should initialize with valid config", () => {
      expect(() => new FrameworkComponent(validConfig)).not.toThrow();
      expect(component.isReady()).toBe(true);
    });
    
    it("should throw error with invalid config", () => {
      expect(() => new FrameworkComponent(invalidConfig)).toThrow(ValidationError);
    });
  });
  
  describe("operation", () => {
    it("should handle normal operation", async () => {
      const input = { data: "test" };
      const result = await component.process(input);
      
      expect(result).toEqual(expectedOutput);
    });
    
    it("should handle edge cases", async () => {
      const edgeCases = [null, undefined, "", 0, []];
      
      for (const testCase of edgeCases) {
        await expect(component.process(testCase)).rejects.toThrow();
      }
    });
    
    it("should handle concurrent operations", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        component.process({ data: `test-${i}` })
      );
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result.data).toBe(`processed-test-${index}`);
      });
    });
  });
});

// ❌ DON'T: Write minimal or incomplete tests
describe("Bad Tests", () => {
  it("should work", () => {
    const component = new FrameworkComponent();
    expect(component).toBeDefined();  // Too basic
  });
});
```

### Integration Testing

```typescript
// ✅ DO: Test component interactions
describe("Integration Tests", () => {
  let framework: Framework;
  let mockService: MockService;
  
  beforeEach(async () => {
    mockService = new MockService();
    framework = new Framework({
      services: [mockService],
      config: integrationConfig
    });
    
    await framework.initialize();
  });
  
  afterEach(async () => {
    await framework.cleanup();
  });
  
  it("should handle end-to-end workflow", async () => {
    // Setup
    const inputData = createTestData();
    
    // Execute
    const result = await framework.processWorkflow(inputData);
    
    // Verify
    expect(result.status).toBe("success");
    expect(mockService.getCalls()).toHaveLength(3);
    expect(result.data).toMatchSnapshot();
  });
});
```

## Security Patterns

### Input Validation and Sanitization

```typescript
// ✅ DO: Implement comprehensive security measures
import { escape } from "html-escaper";

class SecureFramework {
  private sanitizeInput(input: string): string {
    // Remove dangerous characters
    const dangerous = /<script|javascript:|data:|vbscript:/gi;
    return escape(input.replace(dangerous, ""));
  }
  
  private validateApiKey(key: string): boolean {
    // Constant-time comparison to prevent timing attacks
    const expected = process.env.API_KEY || "";
    if (key.length !== expected.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < expected.length; i++) {
      result |= key.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    
    return result === 0;
  }
  
  async processSecureData(data: unknown, apiKey: string): Promise<any> {
    // Validate API key
    if (!this.validateApiKey(apiKey)) {
      throw new SecurityError("Invalid API key");
    }
    
    // Validate and sanitize input
    const validatedData = secureDataSchema.parse(data);
    
    // Process with security context
    return await this.secureProcess(validatedData);
  }
}

// ❌ DON'T: Skip security validations
class InsecureFramework {
  async processData(data: any): Promise<any> {
    // No validation, no sanitization
    return await this.process(data);
  }
}
```

## Anti-patterns and Common Mistakes

### Configuration Anti-patterns

```typescript
// ❌ DON'T: Use magic numbers or hardcoded values
const badConfig = {
  timeout: 5000,           // Magic number
  retries: 3,             // Magic number
  endpoint: "http://localhost:8080"  // Hardcoded URL
};

// ✅ DO: Use named constants and environment variables
const CONFIG = {
  TIMEOUT_MS: parseInt(process.env.TIMEOUT_MS || "5000", 10),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || "3", 10),
  ENDPOINT: process.env.API_ENDPOINT || "http://localhost:8080"
} as const;
```

### Error Handling Anti-patterns

```typescript
// ❌ DON'T: Swallow errors or use generic catches
try {
  await riskyOperation();
} catch (error) {
  console.log("Something went wrong");  // No context
  return null;  // Silent failure
}

// ❌ DON'T: Expose internal errors to users
catch (error) {
  throw new Error(error.stack);  // Leaks internal details
}

// ✅ DO: Handle errors appropriately
catch (error) {
  logger.error("Operation failed", { error: error.message, context });
  
  if (error instanceof KnownError) {
    throw new UserFriendlyError("Operation could not be completed");
  }
  
  throw new SystemError("Internal server error", { cause: error });
}
```

### Performance Anti-patterns

```typescript
// ❌ DON'T: Ignore performance implications
async function inefficientOperation(items: any[]) {
  const results = [];
  for (const item of items) {
    // N+1 queries problem
    const data = await database.get(item.id);
    results.push(await processData(data));
  }
  return results;
}

// ✅ DO: Optimize for performance
async function efficientOperation(items: any[]) {
  // Batch queries
  const ids = items.map(item => item.id);
  const dataItems = await database.getMany(ids);
  
  // Parallel processing
  const results = await Promise.all(
    dataItems.map(data => processData(data))
  );
  
  return results;
}
```

## Best Practices Summary

### Code Organization
- Use consistent project structure
- Separate concerns into modules
- Implement proper dependency injection
- Use TypeScript for type safety

### Error Handling
- Create specific error types
- Provide meaningful error messages
- Log errors with context
- Handle edge cases gracefully

### Performance
- Implement caching strategies
- Use lazy loading where appropriate
- Monitor performance metrics
- Optimize database queries

### Security
- Validate all inputs
- Sanitize user data
- Use secure authentication
- Implement rate limiting

### Testing
- Write comprehensive unit tests
- Include integration tests
- Test error scenarios
- Use proper mocking strategies

### Documentation
- Document complex logic
- Provide usage examples
- Keep documentation updated
- Include troubleshooting guides

## References
- Framework Official Documentation
- TypeScript Best Practices
- Security Guidelines
- Performance Optimization Guides
- Testing Strategies
</PROMPT_LAYOUT>