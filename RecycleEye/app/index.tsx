import { useState, useRef, useEffect } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Ionicons } from "@expo/vector-icons"; 
import { COLORS } from '../constants/colors';

export default function Page() {
  // --- 1. HOOK'LAR ---
  const [permission, requestPermission] = useCameraPermissions();
  const [appMode, setAppMode] = useState<'home' | 'camera' | 'gallery'>('home');
  const [result, setResult] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // IP Adresin
  const API_URL = 'http://172.23.70.89:8000/predict'; 

  // --- 2. FONKSİYONLAR ---

  // A) Canlı Kamera Analizi
  const takePictureAndAnalyze = async () => {
    if (isProcessing || !cameraRef.current || appMode !== 'camera') return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: false,
        skipProcessing: true,
      });
      if (!photo) return;
      await sendToApi(photo.uri, 'live.jpg');
    } catch (error) {
      console.log("Hata:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // B) Galeriden Seçme
  const pickFromGallery = async () => {
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!pickerResult.canceled) {
      const uri = pickerResult.assets[0].uri;
      setSelectedImage(uri);
      setAppMode('gallery'); 
      setResult(null);
      await sendToApi(uri, 'gallery.jpg');
    }
  };

  // C) API İsteği
  const sendToApi = async (uri: string, name: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: name,
      type: 'image/jpeg',
    } as any);

    try {
      if(appMode === 'gallery') setIsProcessing(true);
      const response = await axios.post(API_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5000 
      });
      setResult(response.data.atik_turu);
    } catch (error) {
      console.error(error);
      if(appMode === 'gallery') Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    } finally {
      if(appMode === 'gallery') setIsProcessing(false);
    }
  };

  // D) Döngü
  useEffect(() => {
    let interval: any;
    if (appMode === 'camera' && permission?.granted) {
      interval = setInterval(() => {
          takePictureAndAnalyze();
      }, 1500); 
    }
    return () => clearInterval(interval);
  }, [appMode, permission, isProcessing]); 


  // --- 3. İZİN EKRANI ---
  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.textBasic}>Kamera izni gerekiyor.</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- 4. GÖRÜNÜM ---

  // MOD: KAMERA (CANLI)
  if (appMode === 'camera') {
    return (
      <View style={styles.containerBlack}>
        <StatusBar barStyle="light-content" />
        <CameraView style={{flex: 1}} facing="back" ref={cameraRef}>
          <SafeAreaView style={styles.cameraTop}>
            <TouchableOpacity onPress={() => { setAppMode('home'); setResult(null); }} style={styles.closeBtn}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            <View style={styles.liveBadge}>
               <View style={styles.redDot} />
               <Text style={{color:'white', fontWeight:'bold', fontSize:12}}>CANLI MOD</Text>
            </View>
          </SafeAreaView>

          <View style={styles.cameraBottom}>
            <View style={styles.resultCard}>
                {!result && !isProcessing && <Text style={styles.hintText}>Nesneyi kameraya tutun...</Text>}
                {isProcessing && !result && <Text style={styles.loadingText}>Analiz ediliyor...</Text>}
                {result && (
                    <View style={styles.resultRow}>
                        <Ionicons name="checkmark-circle" size={40} color={COLORS.success} />
                        <View style={{marginLeft: 15}}>
                            <Text style={styles.resultTitle}>Tespit Edildi</Text>
                            <Text style={styles.resultValue}>{result}</Text>
                        </View>
                    </View>
                )}
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Ionicons name="leaf" size={40} color={COLORS.primary} />
        <Text style={styles.title}>RecycleEye</Text>
      </View>

      <View style={styles.content}>
        
        <View style={styles.cardContainer}>
            {appMode === 'gallery' && selectedImage ? (
                // Resim Seçildiyse
                <>
                    <Image source={{ uri: selectedImage }} style={styles.galleryImage} />
                    <TouchableOpacity style={styles.closeGalleryBtn} onPress={() => { setAppMode('home'); setSelectedImage(null); setResult(null); }}>
                        <Ionicons name="close-circle" size={30} color="white" />
                    </TouchableOpacity>
                    <View style={styles.galleryResultBar}>
                        {isProcessing ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : result ? (
                            <Text style={styles.galleryResultText}>Atık: {result}</Text>
                        ) : (
                            <Text style={{color:'#666'}}>Sonuç bekleniyor...</Text>
                        )}
                    </View>
                </>
            ) : (
                // Resim Yoksa (Screenshot'taki Görüntü)
                <View style={styles.placeholderBox}>
                    <Ionicons name="image-outline" size={70} color="#E0DCD9" />
                    <Text style={styles.placeholderText}>Henüz bir resim seçilmedi</Text>
                </View>
            )}
        </View>

        {/* 3. BUTONLAR (Alt Tarafta) */}
        <View style={styles.buttonRow}>
           <TouchableOpacity style={[styles.actionBtn, {backgroundColor: COLORS.primary}]} onPress={() => setAppMode('camera')}>
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.buttonText}>Kamera</Text>
           </TouchableOpacity>

           <TouchableOpacity style={[styles.actionBtn, {backgroundColor: COLORS.secondary}]} onPress={pickFromGallery}>
              <Ionicons name="images" size={24} color="white" />
              <Text style={styles.buttonText}>Galeri</Text>
           </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerBlack: { flex: 1, backgroundColor: 'black' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Başlık Alanı
  header: {
    marginTop: 40,
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 5,
    letterSpacing: 0.5
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
  },

  // Beyaz Kutu (Card)
  cardContainer: {
    width: '100%',
    aspectRatio: 1, // Tam kare olması için
    backgroundColor: COLORS.white,
    borderRadius: 24,
    marginTop: 20,
    marginBottom: 40,
    // Hafif Gölge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden'
  },
  
  // Boş Durum
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  placeholderText: {
    marginTop: 20,
    color: '#B0A8A0', // Daha yumuşak gri
    fontSize: 16,
    fontWeight: '400'
  },

  // Galeri Modu
  galleryImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  closeGalleryBtn: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
  galleryResultBar: {
    position: 'absolute', bottom: 0, width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 15, alignItems: 'center',
  },
  galleryResultText: {
    fontSize: 20, fontWeight: 'bold',
    color: COLORS.primary, textTransform: 'capitalize'
  },

  // Butonlar
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 'auto',
    marginBottom: 50
  },
  actionBtn: {
    flex: 1,
    height: 60,
    borderRadius: 30, // Tam yuvarlak kenarlar
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: "#000", // Buton gölgesi
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },

  // Kamera Arayüzü
  cameraTop: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 20, marginTop: 20,
  },
  closeBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#D9534F',
    paddingHorizontal: 12, height: 32, borderRadius: 16,
  },
  redDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'white', marginRight: 6,
  },
  cameraBottom: { position: 'absolute', bottom: 0, width: '100%', padding: 20, paddingBottom: 40 },
  resultCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center',
    minHeight: 100, justifyContent: 'center',
  },
  hintText: { color: '#888', fontSize: 16 },
  loadingText: { color: COLORS.primary, fontWeight: '600', fontSize: 16 },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  resultTitle: { fontSize: 14, color: '#666' },
  resultValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.textDark, textTransform: 'capitalize' },
  
  // Genel
  textBasic: { fontSize: 16, marginBottom: 20, color: COLORS.textDark },
  btnPrimary: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold' }
});