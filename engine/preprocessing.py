import cv2

def preprocess_image(image_path):

    image = cv2.imread(image_path)

    # enlarge image (important for handwriting)
    image = cv2.resize(image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # slight blur
    gray = cv2.GaussianBlur(gray, (3,3), 0)

    return gray