import requests
from firebase_admin import auth


def main():
    # CREATE NEW USER
    # USER URL

    EMAIL = "email"
    PASSWORD = "pw"
    API_KEY = "token"

    token = get_firebase_token(EMAIL, PASSWORD, API_KEY)

    print("Firebase ID Token:", token)
    
    #---------------------------------------------------------------------------------------------

    #CREATE NEW PLANT
    # PLANT URL 
    url = 'http://127.0.0.1:8000/api/plants/'

    data = {
        "name": "banana",
        #description": "",
        #"scientific_name": "Capsicum chinense",
        # Include any other required fields for your Plant model
    }

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = requests.post(url, json=data, headers=headers)
    print("Feladott növény")
    print(response.json())
    

    #A post visszaadná ezt a növényt, amit éppen létrehoztunk.
    #Azt megcsinálni, hogy a backend adja vissza a felhasználó növényeit.

    #Retrieve all plants

    response = requests.get(url, headers=headers)
    print("All plants")
    print(response.json())


    headers = {
        "Authorization": f"Bearer {token}"
    }

    url1 = 'http://127.0.0.1:8000/api/userplants/'
    response = requests.get(url1, headers=headers)
    print("Only user plants")
    print(response.json())
    # url2 = f'http://127.0.0.1:8000/api/userplants/15/'
    # response = requests.delete(url2, headers=headers)
    # response = requests.get(url1, headers=headers)
    # print("Only user plants")
    # print(response.json())

    exit()



def get_firebase_token(email, password, api_key):
    """Sign in via Firebase and get ID token"""
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        return response.json()["idToken"]
    else:
        print("Failed to sign in:", response.json())
        return None



if __name__ == "__main__":
    main()