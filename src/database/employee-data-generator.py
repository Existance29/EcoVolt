import random
from datetime import datetime, timedelta
import pyperclip

# Function to generate random data
def generate_random_data(emailDomain, namesAcessLevelMap, companyID):
    data = []
    for n, l in namesAcessLevelMap.items():
        email = f"{n}@{emailDomain}"
        data.append((
            email,
            l,
            companyID
        ))
    return data

def generate_data_for_towers(emailDomains, namesAccessLevelMap):
    all_data = []
    for i, e in enumerate(emailDomains):
        employee_data = generate_random_data(e, namesAccessLevelMap, i+1)
        all_data.extend(employee_data)

    return all_data


# Insert statement generation
def generate_insert_statements(data):
    statements = []
    for entry in data:
        statement = f"(NULL, '{entry[0]}', {entry[1]}, {entry[2]})"
        statements.append(statement)
    return ",\n".join(statements)

# Parameters
companyEmailDomains = ["singtel.com", "m1.com.sg", "simba.sg", "starhub.com"]
namesAccessLevelMap = {
    "e": 0,
    "a": 1,
    "employee": 0,
    "admin": 1,
    "john_doe": 0,
    "jane_smith": 0,
    "alex_taylor": 0,
    "alice_tan": 0,
    "dominic_lee": 0,
    "benedict_soh": 0,
    "apple_lim": 0,
    "jane_doe": 1,
    "daniel_jackson": 1, 
    "candence_tan": 1,
    "jessica_morris": 1,
    "william_bennet": 1,
    "bob_lee": 1
}
# Generate data
data = generate_data_for_towers(companyEmailDomains, namesAccessLevelMap)

# Generate SQL Insert Statement
insert_prefix = "INSERT employee_access (user_id, email, access_level, company_id)\nSELECT * FROM (VALUES\n"
insert_data = generate_insert_statements(data)
sql_insert_statement = insert_prefix + insert_data + ") AS temp (user_id, mail, access_level, company_id);"

# Print the generated SQL statement
pyperclip.copy(sql_insert_statement)
print("done")