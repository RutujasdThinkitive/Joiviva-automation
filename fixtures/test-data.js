const { faker } = require('@faker-js/faker');

/**
 * TestDataFactory - Generates test data for Joiviva QA testing.
 */
class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      password: 'TestPass123!',
      role: 'user',
      ...overrides,
    };
  }

  static createUsers(count, overrides = {}) {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  static get invalidUsers() {
    return {
      missingEmail: { name: 'John Doe', password: 'Pass123!' },
      invalidEmail: { email: 'not-an-email', name: 'John', password: 'Pass123!' },
      shortPassword: { email: 'john@test.com', name: 'John', password: '12' },
      emptyFields: { email: '', name: '', password: '' },
      sqlInjection: { email: "admin'--@test.com", name: "'; DROP TABLE users;--", password: 'Pass123!' },
      xssPayload: { email: 'xss@test.com', name: '<script>alert("xss")</script>', password: 'Pass123!' },
    };
  }

  /** Admin Portal credentials */
  static get adminCredentials() {
    return {
      username: process.env.ADMIN_USERNAME || 'olivia',
      password: process.env.ADMIN_PASSWORD || 'Pass@123',
    };
  }

  /** Provider Portal credentials */
  static get providerCredentials() {
    return {
      username: process.env.PROVIDER_USERNAME || 'testnewprovider',
      password: process.env.PROVIDER_PASSWORD || 'Pass@123',
    };
  }

  /** Invalid credentials for negative testing */
  static get invalidCredentials() {
    return {
      wrongUsername: { username: 'invaliduser999', password: 'Pass@123' },
      wrongPassword: { username: 'olivia', password: 'WrongPass@999' },
      emptyFields: { username: '', password: '' },
      sqlInjection: { username: "admin'--", password: "' OR 1=1--" },
      xssPayload: { username: '<script>alert(1)</script>', password: 'Pass@123' },
    };
  }

  /** Generate a patient record */
  static createPatient(overrides = {}) {
    return {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toISOString().split('T')[0],
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Other']),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
      ...overrides,
    };
  }

  /** Generate appointment data */
  static createAppointment(overrides = {}) {
    const futureDate = faker.date.future({ years: 0.1 });
    return {
      date: futureDate.toISOString().split('T')[0],
      time: `${faker.number.int({ min: 9, max: 16 })}:${faker.helpers.arrayElement(['00', '15', '30', '45'])}`,
      type: faker.helpers.arrayElement(['Follow-up', 'New Patient', 'Consultation', 'Telehealth']),
      reason: faker.lorem.sentence(),
      ...overrides,
    };
  }
}

module.exports = { TestDataFactory };
